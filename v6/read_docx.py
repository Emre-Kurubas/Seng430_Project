import zipfile
import xml.etree.ElementTree as ET
import sys
import re

def read_docx(path):
    try:
        with zipfile.ZipFile(path) as docx:
            tree = ET.parse(docx.open('word/document.xml'))
            root = tree.getroot()
            texts = []
            
            # Simple text extraction, capturing paragraphs
            for para in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
                para_text = []
                for text_node in para.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'):
                    if text_node.text:
                        para_text.append(text_node.text)
                if para_text:
                    texts.append(''.join(para_text))
            
            return '\n'.join(texts)
    except Exception as e:
        return str(e)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        print(read_docx(sys.argv[1]))
    else:
        print("Please provide a file path")
