import jsPDF from "jspdf";

type SubjectRow = {
  subject: string;
  progress: number;
  comment: string;
};

const EXAMPLE_ROWS: SubjectRow[] = [
  { subject: "Mathématiques", progress: 78, comment: "Bonne progression, continuer les fractions." },
  { subject: "Français", progress: 69, comment: "Travailler l'expression écrite et les accords." },
  { subject: "Physique-Chimie", progress: 62, comment: "Renforcer les circuits avec exercices guidés." },
  { subject: "Histoire-Géo", progress: 74, comment: "Bon niveau, réviser les repères clés." },
];

export function downloadParentReportExamplePdf() {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 18;

  // Header (Notria logo + title)
  doc.setFillColor(15, 118, 110);
  doc.roundedRect(margin, 10, pageWidth - margin * 2, 20, 3, 3, "F");
  doc.setFillColor(245, 158, 11);
  doc.roundedRect(margin + 4, 13, 14, 14, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("N", margin + 9.3, 21.8, { align: "center" });
  doc.setFontSize(13);
  doc.text("NOTRIA - RAPPORT PARENT", margin + 22, 22.2);

  y = 38;
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Rapport hebdomadaire (Exemple)", margin, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Élève: Fatou K. | Classe: 3eme | Examen: BEPC", margin, y);
  y += 6;
  doc.text("Période: 17 au 23 février 2026", margin, y);

  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Résumé global", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  const summary = doc.splitTextToSize(
    "Fatou a suivi 9 séances cette semaine. Progrès réguliers en mathématiques. Point d'attention en physique. Recommandation: 2 séances ciblées sur circuits + 1 mini BEPC blanc vendredi.",
    pageWidth - margin * 2
  );
  doc.text(summary, margin, y);
  y += summary.length * 5 + 4;

  doc.setFont("helvetica", "bold");
  doc.text("Progression par matière", margin, y);
  y += 7;

  EXAMPLE_ROWS.forEach((row) => {
    if (y > 255) {
      doc.addPage();
      y = 20;
    }

    doc.setDrawColor(225, 232, 240);
    doc.roundedRect(margin, y - 4, pageWidth - margin * 2, 22, 2, 2);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`${row.subject} - ${row.progress}%`, margin + 3, y + 2);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    const comment = doc.splitTextToSize(row.comment, pageWidth - margin * 2 - 8);
    doc.text(comment, margin + 3, y + 8);
    y += 26;
  });

  y += 2;
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.text("Actions parent conseillées", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  const actions = [
    "1. Vérifier le créneau de révision jeudi soir.",
    "2. Encourager la séance BEPC blanc vendredi.",
    "3. Faire un point de 10 minutes dimanche avec l'élève.",
  ];
  actions.forEach((action) => {
    doc.text(action, margin, y);
    y += 5.5;
  });

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Document exemple généré par Notria - Prof Ada", margin, 286);
  doc.save("notria-rapport-parent-exemple.pdf");
}

