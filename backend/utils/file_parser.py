import os
from pypdf import PdfReader
import docx

def parse_file(file_path):
    """
    Detect file type & extract text accordingly.
    Supports: PDF, DOCX, TXT
    """

    ext = os.path.splitext(file_path)[-1].lower()

    if ext == ".pdf":
        return parse_pdf(file_path)

    elif ext == ".docx":
        return parse_docx(file_path)

    elif ext == ".txt":
        return parse_txt(file_path)

    else:
        raise ValueError(f"Unsupported file type: {ext}")


def parse_pdf(path):
    text = ""
    reader = PdfReader(path)
    for page in reader.pages:
        text += page.extract_text() + "\n"
    return text


def parse_docx(path):
    doc = docx.Document(path)
    return "\n".join([para.text for para in doc.paragraphs])


def parse_txt(path):
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()
