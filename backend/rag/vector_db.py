import os
from pinecone import Pinecone, ServerlessSpec

def get_index(index_type="user"):
    """
    Get a Pinecone index by type.
    
    Args:
        index_type (str): Type of index - "user", "management", or "both"
                         For "both", returns the user index (caller handles both separately)
    
    Returns:
        Pinecone Index object
    """
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

    # Determine which index to use based on index_type
    if index_type == "management":
        index_name = os.getenv("PINECONE_MANAGEMENT_INDEX_NAME", "management")
    elif index_type == "both":
        # For "both", return user index (the caller will get management separately)
        index_name = os.getenv("PINECONE_INDEX_NAME", "rag")
    else:  # Default to "user"
        index_name = os.getenv("PINECONE_INDEX_NAME", "rag")

    if index_name not in pc.list_indexes().names():
        pc.create_index(
            name=index_name,
            dimension=384,
            metric="cosine",
            spec=ServerlessSpec(
                cloud="aws",
                region="us-east-1"
            )
        )

    return pc.Index(index_name)
