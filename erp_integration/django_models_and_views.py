# -*- coding: utf-8 -*-
"""
Пример интеграции в Django-проект ERP СТИ НИЯУ МИФИ (https://erp.ssti.ru/)
Содержит модель научной публикации, сериализатор и AJAX-обработчик для автозаполнения формы.
"""

from django.db import models
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from .ssti_erp_client import SstiErpParserClient

class SstiScientificPublication(models.Model):
    """Модель научной публикации для отчетов преподавателей и кафедр СТИ НИЯУ МИФИ"""
    title = models.CharField("Название публикации", max_length=1000)
    authors_str = models.CharField("Все авторы", max_length=500)
    ssti_authors = models.CharField("Авторы из СТИ НИЯУ МИФИ", max_length=500, blank=True)
    journal_name = models.CharField("Издание / Журнал / Сборник", max_length=500, blank=True)
    publication_year = models.PositiveSmallIntegerField("Год издания", null=True, blank=True)
    volume = models.CharField("Том", max_length=50, blank=True)
    issue = models.CharField("Номер / Выпуск", max_length=50, blank=True)
    pages = models.CharField("Страницы", max_length=50, blank=True)
    
    # Наукометрические идентификаторы
    doi = models.CharField("DOI", max_length=150, blank=True)
    edn = models.CharField("EDN (РИНЦ)", max_length=20, blank=True)
    issn_isbn = models.CharField("ISSN / ISBN", max_length=50, blank=True)
    udc = models.CharField("УДК", max_length=50, blank=True)
    grnti = models.CharField("ГРНТИ", max_length=50, blank=True)
    
    # Категории для рейтингов и эффективных контрактов
    is_vak = models.BooleanField("Входит в перечень ВАК", default=False)
    is_rsci = models.BooleanField("Индексируется в РИНЦ", default=True)
    is_rsci_core = models.BooleanField("Входит в Ядро РИНЦ / RSCI", default=False)
    is_scopus_wos = models.BooleanField("Scopus / Web of Science", default=False)
    is_white_list = models.BooleanField("Белый список", default=False)
    citations_count = models.PositiveIntegerField("Цитирований", default=0)
    
    # Ссылка и библиографическая ссылка
    elibrary_url = models.URLField("Ссылка на eLibrary", max_length=500, unique=True)
    gost_citation = models.TextField("Библиографическое описание (ГОСТ)", blank=True)
    abstract = models.TextField("Аннотация", blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Научная публикация"
        verbose_name_plural = "Научные публикации"
        ordering = ["-publication_year", "-created_at"]

    def __str__(self):
        return f"{self.publication_year or ''} - {self.title[:80]}"


@login_required
@require_POST
def parse_and_autofill_ajax(request):
    """
    AJAX endpoint для страницы добавления публикации в ERP СТИ НИЯУ МИФИ.
    Преподаватель вставляет ссылку на eLibrary и нажимает кнопку 'Заполнить из eLibrary'.
    """
    url = request.POST.get("elibrary_url", "").strip()
    if not url:
        return JsonResponse({"status": "error", "message": "Не указан URL"}, status=400)

    client = SstiErpParserClient()
    try:
        raw_paper = client.parse_url(url)
        prepared = client.prepare_for_erp_model(raw_paper)
        return JsonResponse({"status": "success", "data": prepared})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)
