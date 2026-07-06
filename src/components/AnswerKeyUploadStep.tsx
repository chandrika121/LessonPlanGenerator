import { FileCheck2, Upload } from "lucide-react";

export function AnswerKeyUploadStep({
  fileName,
  onUpload,
}: {
  fileName?: string;
  onUpload: (file: File) => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#36ADAA]">Step 2</p>
        <h3 className="mt-2 font-display text-2xl font-extrabold text-slate-900">Upload answer key</h3>
        <p className="mt-2 text-sm leading-7 text-slate-500">Upload the official answer key in PDF or DOCX format to map expected answers with the extracted questions.</p>

        <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-[#36ADAA]/35 bg-[#36ADAA]/6 px-6 py-10 text-center">
          <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
            <Upload className="h-5 w-5" />
          </div>
          <div className="mt-4 text-base font-bold text-slate-900">Choose PDF or DOCX</div>
          <div className="mt-2 text-sm text-slate-500">Supported formats: `.pdf`, `.docx`</div>
          <input
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onUpload(file);
              event.currentTarget.value = "";
            }}
          />
        </label>

        <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
          <span className="font-semibold text-slate-800">Uploaded file:</span> {fileName || "No file selected yet"}
        </div>
      </div>

      <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
            <FileCheck2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#36ADAA]">Mapping Preview</p>
            <h3 className="font-display text-2xl font-extrabold text-slate-900">Answer-key mapping</h3>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {[
            "Q1 -> Expected definition of matter",
            "Q2 -> Comparison points for elements vs compounds",
            "Q3 -> Core explanation + example + scientific terminology",
          ].map((item) => (
            <div key={item} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {item}
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs leading-6 text-slate-500">Placeholder answer-key mapping UI for now. Backend mapping logic can be plugged into this panel later.</p>
      </div>
    </div>
  );
}
