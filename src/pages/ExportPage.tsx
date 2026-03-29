import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet, Shield, Download } from "lucide-react";
import { useCollection } from "@/context/CollectionContext";
import { toast } from "sonner";
import { exportCSV, exportPDF, exportInsurance } from "@/lib/exportUtils";

const exportOptions = [
  {
    title: "CSV Export",
    description: "Spreadsheet format with all item details, values, and authentication data.",
    icon: FileSpreadsheet,
    action: "csv",
  },
  {
    title: "PDF Report",
    description: "Formatted document with item photos, details, and portfolio summary.",
    icon: FileText,
    action: "pdf",
  },
  {
    title: "Insurance Report",
    description: "Comprehensive report including photos, authentication, purchase prices, and total value for insurance purposes.",
    icon: Shield,
    action: "insurance",
  },
];

export default function ExportPage() {
  const { items, getTotalValue } = useCollection();

  const handleExport = (type: string) => {
    try {
      if (type === "csv") {
        exportCSV(items);
        toast.success("CSV file downloaded!");
      } else if (type === "pdf") {
        exportPDF(items);
        toast.success("PDF report opened — use Print to save as PDF.");
      } else if (type === "insurance") {
        exportInsurance(items);
        toast.success("Insurance report opened — use Print to save as PDF.");
      }
    } catch (e) {
      toast.error("Export failed. Please try again.");
    }
  };

  return (
    <div className="container max-w-2xl py-6 pb-24 md:pb-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Export</h1>
        <p className="text-muted-foreground text-sm">Download your collection data</p>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Exporting</p>
              <p className="font-bold">{items.length} items · ${getTotalValue().toLocaleString()}</p>
            </div>
            <Download className="w-5 h-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {exportOptions.map((opt) => (
          <Card key={opt.action} className="card-hover">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                  <opt.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">{opt.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{opt.description}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => handleExport(opt.action)}>
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
