import { useState } from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import dynamic from "next/dynamic";
import Link from "next/link";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function Home() {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({ completionRate: 0, sectors: {}, regions: {} });

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: "binary" });
      const ws = wb.Sheets["Etat0 "];
      const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
      const headers = jsonData[1];
      const rows = jsonData.slice(2).map(row => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = row[i] || ""; });
        return obj;
      });
      setData(rows);
      calculateStats(rows);
    };
    reader.readAsBinaryString(file);
  };

  const calculateStats = (rows) => {
    const total = rows.length;
    const completed = rows.filter(r => Object.values(r).every(v => v !== "")).length;
    const completionRate = Math.round((completed / total) * 100);
    const sectors = {};
    const regions = {};
    rows.forEach(r => {
      if (r["Secteur"]) sectors[r["Secteur"]] = (sectors[r["Secteur"]] || 0) + 1;
      if (r["Région"]) regions[r["Région"]] = (regions[r["Région"]] || 0) + 1;
    });
    setStats({ completionRate, sectors, regions });
  };

  const saveExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Etat0 ");
    XLSX.writeFile(wb, "TPE_Mis_A_Jour.xlsx");
  };

  const sectorChart = {
    series: [{ data: Object.values(stats.sectors) }],
    options: {
      chart: { type: "bar" },
      xaxis: { categories: Object.keys(stats.sectors) },
      title: { text: "Répartition par secteur" }
    }
  };

  const regionChart = {
    series: [{ data: Object.values(stats.regions) }],
    options: {
      chart: { type: "pie" },
      labels: Object.keys(stats.regions),
      title: { text: "Répartition par région" }
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">TPE Manager</h1>
      <input type="file" accept=".xlsx" onChange={handleFileUpload} className="mb-4" />

      {data.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded shadow p-4">
            <h2 className="text-lg font-semibold">Taux de complétion</h2>
            <p className="text-2xl font-bold">{stats.completionRate}%</p>
          </div>
          <div className="bg-white rounded shadow p-4">
            <Chart {...sectorChart} height={300} />
          </div>
          <div className="bg-white rounded shadow p-4 col-span-2">
            <Chart {...regionChart} height={300} />
          </div>
        </div>
      )}

      {data.length > 0 && (
        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="min-w-full border">
            <thead>
              <tr>
                {Object.keys(data[0]).map((key) => (
                  <th key={key} className="border px-2 py-1 text-xs">{key}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  {Object.keys(row).map((key) => (
                    <td key={key} className="border px-1 py-1 text-xs">{row[key]}</td>
                  ))}
                  <td className="border px-1 py-1">
                    <Link href={{ pathname: "/tpe", query: { id: i } }} className="text-blue-500">Voir</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex gap-4 mt-4">
            <button onClick={saveExcel} className="bg-blue-500 text-white px-4 py-1 rounded">Sauvegarder Excel</button>
          </div>
        </div>
      )}
    </div>
  );
}
