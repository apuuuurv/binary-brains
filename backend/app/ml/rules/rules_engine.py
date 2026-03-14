"""
Rule Engine for scheme eligibility filtering.

Evaluates farmer profiles against scheme rules.
Now supports loading schemes from both YAML and a SQL database.
"""

import yaml
from typing import List, Dict, Any
from urllib.parse import quote
from sqlalchemy.orm import Session
from app.core.database_sql import SessionLocal, SchemeSQL
import json

class RulesEngine:
    """
    Rule-based engine that filters schemes based on eligibility conditions.
    """

    MYSCHEME_SEARCH_BASE = "https://www.myscheme.gov.in/search?q="
    MYSCHEME_CATEGORY_URL = "https://www.myscheme.gov.in/search/category/Agriculture,Rural%20%26%20Environment"

    def __init__(self, rules_path: str):
        self.rules_path = rules_path
        self.schemes = self.load_rules()

        # Supported operators
        self.operators = {
            "==": lambda a, b: a == b,
            "!=": lambda a, b: a != b,
            "<": lambda a, b: float(a) < float(b),
            "<=": lambda a, b: float(a) <= float(b),
            ">": lambda a, b: float(a) > float(b),
            ">=": lambda a, b: float(a) >= float(b),
            "in": lambda a, b: a in b if isinstance(b, list) else False,
            "not_in": lambda a, b: a not in b if isinstance(b, list) else False,
        }

    def _build_apply_url(self, stored_url: str, scheme_name: str) -> str:
        """
        Returns the best available application URL for a scheme.
        Priority: stored source_url → myScheme search by name → category page.
        """
        if stored_url and stored_url.startswith("http"):
            return stored_url
        if scheme_name:
            return f"{self.MYSCHEME_SEARCH_BASE}{quote(scheme_name)}"
        return self.MYSCHEME_CATEGORY_URL

    def load_rules(self) -> List[Dict]:
        """
        Load scheme rules from YAML file and SQL database.
        """
        schemes = []
        
        # 1. Load from YAML (Legacy/Hand-curated)
        try:
            with open(self.rules_path, "r", encoding="utf-8") as file:
                data = yaml.safe_load(file)
                yaml_schemes = data.get("schemes", [])
                for ys in yaml_schemes:
                    # Guarantee source_url is always populated
                    if not ys.get("source_url"):
                        ys["source_url"] = self._build_apply_url("", ys.get("name", ""))
                    # apply_url: use YAML field if set, otherwise fall back to source_url
                    if not ys.get("apply_url"):
                        ys["apply_url"] = ys["source_url"]
                schemes.extend(yaml_schemes)
        except Exception as e:
            print(f"Error loading YAML rules: {e}")

        # 2. Load from SQL (Crawled results)
        try:
            db = SessionLocal()
            sql_schemes = db.query(SchemeSQL).all()
            for s in sql_schemes:
                # Convert SQL model to dict format that the RulesEngine expects
                # we assume eligibility_criteria is stored as a list of rules in JSON
                rules = s.eligibility_criteria if isinstance(s.eligibility_criteria, list) else []

                schemes.append({
                    "scheme_id": s.scheme_id,
                    "name": s.name,
                    "description": s.description,
                    "rules": rules,
                    "documents_required": s.documents_required,
                    # Always guarantee a valid apply URL
                    "source_url": self._build_apply_url(s.source_url or "", s.name or ""),
                    # Direct ministry portal — preferred for Apply button; falls back to source_url
                    "apply_url": s.apply_url if (s.apply_url and s.apply_url.startswith("http")) else self._build_apply_url(s.source_url or "", s.name or "")
                })
            db.close()
        except Exception as e:
            print(f"Error loading SQL rules: {e}")

        return schemes

    def normalize(self, value):
        """
        Normalize values for comparison.
        """
        if isinstance(value, str):
            return value.strip().lower()
        return value

    def evaluate_rule(self, farmer_value, operator, rule_value) -> bool:
        """
        Evaluate a single rule condition.
        """

        farmer_value = self.normalize(farmer_value)
        rule_value = self.normalize(rule_value)

        op_func = self.operators.get(operator)

        if not op_func:
            print(f"Unsupported operator: {operator}")
            return False

        try:
            return op_func(farmer_value, rule_value)
        except Exception:
            return False

    def check_scheme(self, scheme: Dict, farmer_profile: Dict) -> Dict:
        """
        Check if farmer satisfies all scheme rules, returning detailed pass/fail info.
        """
        rules = scheme.get("rules", [])
        passed_rules = []
        failed_rules = []

        for rule in rules:
            field = rule.get("field")
            operator = rule.get("operator")
            value = rule.get("value")

            farmer_value = farmer_profile.get(field)
            
            # Keep a record of what we evaluated
            rule_record = {
                "field": field,
                "operator": operator,
                "value": value,
                "farmer_value": farmer_value
            }

            # If profile does not contain the required field
            if farmer_value is None:
                failed_rules.append(rule_record)
                continue

            if not self.evaluate_rule(farmer_value, operator, value):
                failed_rules.append(rule_record)
            else:
                passed_rules.append(rule_record)

        is_eligible = len(failed_rules) == 0

        return {
            "is_eligible": is_eligible,
            "passed_rules": passed_rules,
            "failed_rules": failed_rules
        }

    def filter_schemes(self, farmer_profile: Dict) -> Dict[str, List[Dict]]:
        """
        Categorizes all schemes into eligible and ineligible lists with reasons.
        """
        # Reload schemes to get any new crawled data
        self.schemes = self.load_rules()
        
        eligible_schemes = []
        ineligible_schemes = []

        for scheme in self.schemes:
            result = self.check_scheme(scheme, farmer_profile)
            
            # Create a rich scheme object containing the evaluation results
            rich_scheme = dict(scheme)
            rich_scheme["passed_rules"] = result["passed_rules"]
            rich_scheme["failed_rules"] = result["failed_rules"]
            
            if result["is_eligible"]:
                eligible_schemes.append(rich_scheme)
            else:
                ineligible_schemes.append(rich_scheme)

        return {
            "eligible": eligible_schemes,
            "ineligible": ineligible_schemes
        }