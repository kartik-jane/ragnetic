from rag.embeddings import create_embedding
from rag.vector_db import get_index

def retrieve(query, top_k=20, index_type="user"):
    emb = create_embedding(query)

    # If index_type is "both", query both indexes and combine results
    if index_type == "both":
        user_index = get_index("user")
        management_index = get_index("management")
        
        user_result = user_index.query(vector=emb, top_k=top_k, include_metadata=True)
        management_result = management_index.query(vector=emb, top_k=top_k, include_metadata=True)
        
        all_matches = user_result["matches"] + management_result["matches"]
        all_matches.sort(key=lambda x: x["score"], reverse=True)
        return all_matches[:top_k]

    index = get_index(index_type)
    result = index.query(
        vector=emb,
        top_k=top_k,
        include_metadata=True
    )
    return result["matches"]

def retrieve_comprehensive(query, index_type="user", max_results=50):
    query_variations = generate_query_variations(query)

    all_results = []
    seen_ids = set()

    if index_type == "both":
        for q in query_variations:
            emb = create_embedding(q)
            user_index = get_index("user")
            management_index = get_index("management")

            user_result = user_index.query(vector=emb, top_k=15, include_metadata=True)
            management_result = management_index.query(vector=emb, top_k=15, include_metadata=True)

            for match in user_result["matches"] + management_result["matches"]:
                if match["id"] not in seen_ids:
                    all_results.append(match)
                    seen_ids.add(match["id"])

                if len(all_results) >= max_results:
                    break

            if len(all_results) >= max_results:
                break
    else:
        for q in query_variations:
            emb = create_embedding(q)
            index = get_index(index_type)

            result = index.query(
                vector=emb,
                top_k=15,
                include_metadata=True
            )

            for match in result["matches"]:
                if match["id"] not in seen_ids:
                    all_results.append(match)
                    seen_ids.add(match["id"])

                if len(all_results) >= max_results:
                    break

            if len(all_results) >= max_results:
                break

    all_results.sort(key=lambda x: x["score"], reverse=True)
    return all_results[:max_results]

def generate_query_variations(query):
    variations = [query]
    query_lower = query.lower()

    if any(word in query_lower for word in ["all", "list", "complete", "every", "total", "entire"]):
        variations.extend([
            query.replace("all", "").strip(),
            query.replace("list", "").strip(),
            query.replace("complete", "").strip(),
            f"information about {query}",
            f"details on {query}",
            f"find {query}"
        ])

    if any(word in query_lower for word in ["cost", "price", "amount", "number", "total", "sum"]):
        variations.extend([
            f"financial {query}",
            f"numbers for {query}",
            f"calculate {query}",
            f"sum of {query}"
        ])

    variations = list(set([v.strip() for v in variations if v.strip()]))
    return variations[:5]
