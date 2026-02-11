import { Check, X, Minus } from "lucide-react";

const rows = [
  { feature: "Disponible 24/7", notria: true, prof: false, seul: false },
  { feature: "Adapté programme ivoirien", notria: true, prof: true, seul: false },
  { feature: "S'adapte à ton niveau", notria: true, prof: "partial", seul: false },
  { feature: "Correction instantanée", notria: true, prof: false, seul: false },
  { feature: "Suivi de progression", notria: true, prof: false, seul: false },
  { feature: "Planning personnalisé", notria: true, prof: false, seul: false },
  { feature: "Dashboard parent", notria: true, prof: false, seul: false },
  { feature: "Prix", notria: "Gratuit", prof: "25,000+ FCFA/mois", seul: "Gratuit" },
];

function CellIcon({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="w-5 h-5 text-green-600" />;
  if (value === false) return <X className="w-5 h-5 text-slate-300" />;
  if (value === "partial") return <Minus className="w-5 h-5 text-amber-500" />;
  return <span className="text-sm font-semibold text-slate-900">{value}</span>;
}

export function ComparisonSection() {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-amber-600 uppercase tracking-wide mb-3">Comparaison</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Pourquoi choisir Notria ?
          </h2>
          <p className="text-slate-600 text-lg">
            Le meilleur d&apos;un prof particulier, gratuitement.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-4 pr-4 text-sm font-medium text-slate-500 w-[40%]"></th>
                <th className="py-4 px-4 text-center">
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-xl px-4 py-3">
                    <span className="font-bold text-amber-700 text-sm">Notria</span>
                  </div>
                </th>
                <th className="py-4 px-4 text-center">
                  <div className="px-4 py-3">
                    <span className="font-medium text-slate-500 text-sm">Prof particulier</span>
                  </div>
                </th>
                <th className="py-4 px-4 text-center">
                  <div className="px-4 py-3">
                    <span className="font-medium text-slate-500 text-sm">Étudier seul</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-b border-slate-100">
                  <td className="py-4 pr-4 text-sm text-slate-700">{row.feature}</td>
                  <td className="py-4 px-4">
                    <div className="flex justify-center">
                      <CellIcon value={row.notria} />
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-center">
                      <CellIcon value={row.prof} />
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-center">
                      <CellIcon value={row.seul} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
