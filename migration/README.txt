URL-Prüfung für den Livegang der Herz HD Stiftung
Stand: 13. Oktober 2026

ERGEBNIS
33 Seiten aus der aktuellen WordPress-Sitemap wurden abgerufen; alle lieferten HTTP 200.
Die Startseite behält ihre URL. Für 13 weitere Seiten gibt es thematisch passende neue Ziele.
Für 19 Seiten muss vor dem Austausch über Erhalt, Übernahme oder ein anderes Ziel entschieden werden.
Es wurde nichts auf dem Live-Server geändert.

DATEIEN
redirect-audit.json: vollständige Zuordnung aller 33 Seiten, bekannte WordPress-IDs,
offene Inhaltsentscheidungen und direkt verlinkte alte Mediendateien.
ionos-redirects.htaccess.template: vorbereitete 301-Regeln für die 13 eindeutigen
Altpfade und ihre 13 beobachteten ?p=ID-Kurzlinks. Noch keine vollständige Live-Konfiguration.

OFFENE INHALTE
- 10 QR-Seiten für konkrete Kunstwerke bzw. Künstler. Werkdetails und teilweise Preise fehlen
  in der allgemeinen neuen Galerie. Empfehlung: Detailseiten oder Archiv unter den bisherigen
  Adressen erhalten. Auch /bank-q-rcode/ enthält Kunstinformationen über Chango Chitoko.
- 2 vollständige Reiseberichte (2024 und 2025). Die neue Reiseberichte-Seite enthält nur Kurzfassungen.
- 3 Projekt-/Kampagnenseiten: Fowlrun, MSR-300 und Sammelaktion.
- 4 weitere Seiten: Aktuelles, Presse, Tengenenge und Dominikanische Schwestern.
Die candidate_target-Einträge im JSON sind Diskussionsvorschläge, keine freigegebenen Redirects.

WEITERE FUNDE
32 WordPress-Kurzlinks ?p=ID wurden aus den jeweiligen Seiten ausgelesen.
2 PDF-Links und 3 direkt verlinkte JPG-Dateien liegen unter /wp-content/uploads/.
Diese Dateipfade erhalten oder nach Sicherung auf dieselben Dokumente am neuen Ort weiterleiten.
Das zusätzlich verlinkte /de/aktuelles/archiv/2002/ liefert bereits jetzt HTTP 404.
Diese Prüfung ersetzt weder ein vollständiges Inhalts-/Medienbackup noch eine Log-Auswertung.

VOR UND BEIM CUTOVER
1. Zugriffslogs, Search Console und CMS-Export ergänzen, sobald Zugriff vorliegt. Damit lassen sich
   ältere, nicht mehr intern verlinkte URLs und Medien ergänzen. Die 33 Seiten sind keine Garantie
   für sämtliche jemals veröffentlichten URLs.
2. Offene Inhalte klären und sichern. Gleichwertige neue Seiten oder Archivziele bereitstellen.
3. IONOS-Produkt prüfen: Der Entwurf setzt Apache 2.4 mit mod_rewrite und erlaubter .htaccess voraus.
   Bei einem reinen Baukastenprodukt ist dieser Veröffentlichungsweg nicht bestätigt.
4. Bestehende .htaccess und Daten sichern. Regeln zusammenführen; keine vorhandene Konfiguration
   ungeprüft überschreiben. Der Entwurf enthält keine globale Domain-/HTTPS-Regel.
5. Inhalt von version-2 im Domain-Hauptverzeichnis bereitstellen. Gemeinsame und versionseigene
   Assets kontrolliert zusammenführen und relative Pfade anpassen. Alle Zielseiten müssen HTTP 200 liefern.
6. Regeln erst gleichzeitig mit der Umstellung aktivieren, nicht vorher: Die neuen .html-Ziele
   existieren auf der bisherigen Website noch nicht als bestätigte neue Inhalte.
7. www und non-www, HTTP und HTTPS auf die gewählte Hauptadresse abstimmen. Zertifikate prüfen.
8. Auf dem tatsächlichen IONOS-Server alle Altpfade mit/ohne Slash, WordPress-Kurzlinks,
   Query-Parameter und Ziel-Fragmente prüfen. Pro Alt-URL möglichst ein Redirect direkt zum Endziel.
   Die normalen Pfadregeln erhalten Query-Parameter; die Kurzlinkregeln verwerfen sie mit QSD.
9. Passwortschutz und noindex-Angaben der Vorschau im eigentlichen Live-Artefakt entfernen.
   Neue Sitemap und robots.txt erzeugen; alte Sitemap-Endpunkte auf die neue Sitemap umstellen.
   Unbekannte URLs sollen eine echte 404-Antwort liefern, nicht pauschal auf die Startseite führen.
10. Nach Umstellung 404-Fehler und Suchmaschinen-Erfassung beobachten. Dauerhafte Redirects
    mindestens ein Jahr, für gedruckte QR-Codes möglichst dauerhaft beibehalten.

PRÜFSTATUS
Statisch geprüft: 13 Zielpfade inklusive Fragmente vorhanden; 26 Varianten mit/ohne Slash passen;
kein neues Ziel wird von einer vorbereiteten Altpfadregel erneut erfasst.
Apache-Laufzeit, IONOS-Konfiguration, Medienverfügbarkeit nach Umstellung und öffentliche
Redirect-Ketten sind noch nicht geprüft. Es besteht noch kein IONOS-Zugriff in diesem Arbeitsgang.

QUELLEN
https://www.herzhdstiftung.de/robots.txt
https://www.herzhdstiftung.de/wp-sitemap.xml
https://www.herzhdstiftung.de/wp-sitemap-posts-page-1.xml
https://www.ionos.de/hilfe/hosting/htaccess/haeufig-verwendete-htaccess-direktiven/
https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes
