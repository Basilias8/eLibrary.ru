# -*- coding: utf-8 -*-
"""
Клиент интеграции парсера eLibrary для ERP СТИ НИЯУ МИФИ (https://erp.ssti.ru/)
Поддерживает:
1. Вызов локального / удаленного REST API парсера
2. Автоматическое сопоставление со структурой публикаций сотрудников СТИ НИЯУ МИФИ
3. Экспорт в форматы JSON, 1С-совместимый CSV и ГОСТ Р 7.0.100-2018
"""

import re
import json
import requests
from typing import Dict, Any, Optional

class SstiErpParserClient:
    def __init__(self, parser_api_url: str = "http://localhost:3000"):
        self.api_url = parser_api_url.rstrip('/')

    def parse_url(self, elibrary_url: str) -> Dict[str, Any]:
        """
        Отправляет запрос к парсеру и возвращает словарь с наукометрическими данными
        для создания или обновления записи в ERP СТИ НИЯУ МИФИ
        """
        response = requests.post(
            f"{self.api_url}/api/parse",
            json={"url": elibrary_url},
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        response.raise_for_status()
        result = response.json()
        return result.get("paper", {})

    def prepare_for_erp_model(self, paper_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Преобразует полученные данные в поля модели Django ERP СТИ НИЯУ МИФИ
        """
        authors_list = paper_data.get("authors", [])
        author_names = [a.get("fullname", "") for a in authors_list]
        ssti_authors = [a.get("fullname", "") for a in authors_list if a.get("is_ssti_mephi")]

        indexing = paper_data.get("indexing", {})

        return {
            "title": paper_data.get("title", ""),
            "authors_str": ", ".join(author_names),
            "ssti_authors_str": ", ".join(ssti_authors) if ssti_authors else ", ".join(author_names),
            "journal_or_collection": paper_data.get("journal_name") or paper_data.get("work_type", ""),
            "year": paper_data.get("publication_year"),
            "volume": paper_data.get("volume", ""),
            "issue": paper_data.get("issue", ""),
            "pages": paper_data.get("page_range") or str(paper_data.get("pages_count") or ""),
            "doi": paper_data.get("doi", ""),
            "edn": paper_data.get("edn", ""),
            "issn_isbn": paper_data.get("issn_isbn", ""),
            "udc": paper_data.get("udc", ""),
            "grnti": paper_data.get("grnti", ""),
            "is_vak": indexing.get("in_vak", False),
            "is_rsci": indexing.get("in_rsci", True),
            "is_rsci_core": indexing.get("in_rsci_core", False),
            "is_scopus_wos": indexing.get("in_scopus", False),
            "is_white_list": indexing.get("in_white_list", False),
            "citations_count": paper_data.get("citations_count", 0),
            "gost_citation": paper_data.get("gost_citation", ""),
            "elibrary_url": paper_data.get("url", ""),
            "abstract": paper_data.get("abstract_text", ""),
            "keywords": ", ".join(paper_data.get("keywords", [])),
        }

if __name__ == "__main__":
    client = SstiErpParserClient()
    test_url = "https://www.elibrary.ru/item.asp?id=49451230"
    print(f"Тестирование парсера для ERP СТИ НИЯУ МИФИ...")
    try:
        data = client.parse_url(test_url)
        erp_payload = client.prepare_for_erp_model(data)
        print("\n[OK] Сформированные данные для erp.ssti.ru:")
        print(json.dumps(erp_payload, indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"[!] Ошибка: {e}")
