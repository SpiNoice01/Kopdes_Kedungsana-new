import zipfile
import xml.etree.ElementTree as ET
import sys

def extract_text_from_docx(docx_path):
    try:
        with zipfile.ZipFile(docx_path) as docx:
            xml_content = docx.read('word/document.xml')
            tree = ET.XML(xml_content)
            
            WORD_NAMESPACE = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
            PARA = WORD_NAMESPACE + 'p'
            TEXT = WORD_NAMESPACE + 't'
            
            paragraphs = []
            for paragraph in tree.iter(PARA):
                texts = [node.text for node in paragraph.iter(TEXT) if node.text]
                if texts:
                    paragraphs.append(''.join(texts))
            
            return '\n'.join(paragraphs)
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == '__main__':
    text = extract_text_from_docx(r"D:\1-KULIAH\TA\TUGAS-AKHIR-KULIAH\SKRIPSI - MAIN.docx")
    with open(r"D:\1-KULIAH\TA\TUGAS-AKHIR-KULIAH\skripsi_text.txt", "w", encoding="utf-8") as f:
        f.write(text)
    print("Done")
