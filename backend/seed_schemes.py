from app.core.database_sql import SessionLocal, SchemeSQL, init_db
import json

init_db()
db = SessionLocal()

schemes = [
    {
        "scheme_id": "PM_MATSYA_2026",
        "name": "Pradhan Mantri Matsya Sampada Yojana: Refrigerated Vehicles",
        "description": "Financial assistance for purchasing refrigerated vehicles to reduce post-harvest losses in fisheries and ensure quality supply of fish.",
        "details": "The scheme provides up to 40% subsidy for general category and 60% for SC/ST/Women for transport solutions.",
        "benefits": "Financial assistance for purchase of insulated/refrigerated vehicles, motorcycles with ice boxes, etc.",
        "eligibility_criteria": [
            {"field": "farmer_type", "operator": "in", "value": ["small", "medium"]},
            {"field": "state", "operator": "==", "value": "haryana"}
        ],
        "documents_required": ["Aadhar Card", "Panchayat Certificate", "Bank Passbook"],
        "source_url": "https://www.myscheme.gov.in/schemes/pmmsy-rv-haryana"
    },
    {
        "scheme_id": "SKILLED_YOUTH_2026",
        "name": "Skilled Youth Startup Scheme - Agriculture",
        "description": "Promoting entrepreneurship among educated unemployed youth in agriculture and allied sectors.",
        "details": "Interest subsidy and capital investment support for setting up innovative agri-tech startups.",
        "benefits": "35% capital subsidy on projects up to 20 Lakhs.",
        "eligibility_criteria": [
            {"field": "age", "operator": "<=", "value": 45},
            {"field": "state", "operator": "==", "value": "sikkim"}
        ],
        "documents_required": ["Degree Certificate", "Residence Proof", "Project Report"],
        "source_url": "https://www.myscheme.gov.in/schemes/syss"
    },
    {
        "scheme_id": "KRISHI_SA_SAJULI",
        "name": "Mukhya Mantri Krishi Sa Sajuli Yozana",
        "description": "Procurement of farm tools and machinery for small and marginal farmers to improve productivity.",
        "details": "State-owned priority development scheme focusing on mechanization of small holdings.",
        "benefits": "Direct Benefit Transfer (DBT) of ₹5,000 for tools.",
        "eligibility_criteria": [
            {"field": "farmer_type", "operator": "==", "value": "small"},
            {"field": "state", "operator": "==", "value": "assam"}
        ],
        "documents_required": ["Land Possession Certificate", "Farmer ID"],
        "source_url": "https://www.myscheme.gov.in/schemes/mmkssy-assam"
    },
    {
        "scheme_id": "UTTAM_PASHU",
        "name": "Uttam Pashu Puraskar Yojana",
        "description": "Incentivizing farmers for high milk-yielding animals through pure breeding and pure lineages.",
        "details": "Cash prizes for owners of cattle producing more than a specific limit of milk per day.",
        "benefits": "Cash prizes ranging from ₹5,000 to ₹10,000.",
        "eligibility_criteria": [
            {"field": "income", "operator": "<=", "value": 500000},
            {"field": "state", "operator": "==", "value": "himachal pradesh"}
        ],
        "documents_required": ["Cattle Registration", "Milk records"],
        "source_url": "https://www.myscheme.gov.in/schemes/uppy"
    },
    {
        "scheme_id": "NATURAL_FARMING_2026",
        "name": "National Mission on Natural Farming Extended Subsidy",
        "description": "Promotion of chemical-free farming to ensure environmental sustainability and reduced costs.",
        "details": "Technical support and input subsidies for farmers switching from conventional to natural farming.",
        "benefits": "Input subsidy of up to ₹31,000 per hectare.",
        "eligibility_criteria": [
            {"field": "land_size", "operator": ">", "value": 0.5},
            {"field": "irrigation", "operator": "==", "value": True}
        ],
        "documents_required": ["Soil Health Card", "Pledge for Natural Farming"],
        "source_url": "https://www.myscheme.gov.in/schemes/nmnf"
    }
]

for s_data in schemes:
    existing = db.query(SchemeSQL).filter(SchemeSQL.scheme_id == s_data["scheme_id"]).first()
    if not existing:
        scheme = SchemeSQL(**s_data)
        db.add(scheme)

db.commit()
print(f"Successfully seeded {len(schemes)} industrial-ready schemes.")
db.close()
