import os
from pinecone import Pinecone, ServerlessSpec

def get_index():
    pc = Pinecone(api_key=os.getenv("pcsk_7GsmAv_2AZadyCqkPmUqDNcNuz3V2M9JvmrBd6ede3Ri3W5xL87Rvqic8hveBSSfL1wHtH"))

    index_name = "rag"

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
