import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function NewDesignPage() {
  async function createDesign(formData: FormData) {
    "use server";
    
    const code = formData.get("code") as string;
    const name = formData.get("name") as string;
    const imageFile = formData.get("imageFile") as File;

    let imageUrl = null;

    if (imageFile && imageFile.size > 0) {
      const fileName = `${Date.now()}-${imageFile.name}`;
      const filePath = path.join(process.cwd(), "public", "uploads", fileName);
      
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      await fs.writeFile(filePath, buffer);
      
      imageUrl = `/uploads/${fileName}`;
    }

    await prisma.design.create({
      data: {
        code,
        name,
        imageUrl: imageUrl,
      },
    });

    redirect("/designs");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/designs" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Catalog
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 border-l-4 border-emerald-500 pl-4">Add New Carpet Design</h1>
        <p className="text-slate-500">Upload a design photo from your computer.</p>
      </div>

      <form action={createDesign} className="space-y-6 bg-white p-8 rounded-2xl shadow-sm border-2 border-slate-300">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-black text-black uppercase tracking-wider">Design Code (Unique)</label>
            <input 
              type="text" 
              name="code" 
              required 
              placeholder="e.g. PERS-001"
              className="w-full rounded-xl border-2 border-slate-300 focus:border-emerald-600 focus:ring-0 h-11 bg-white font-bold text-black placeholder:text-slate-400" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-black text-black uppercase tracking-wider">Design Name</label>
            <input 
              type="text" 
              name="name" 
              required 
              placeholder="e.g. Blue Persian Vintage"
              className="w-full rounded-xl border-2 border-slate-300 focus:border-emerald-600 focus:ring-0 h-11 bg-white font-bold text-black placeholder:text-slate-400" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-black text-black uppercase tracking-wider">Design Photo (Upload from PC)</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-emerald-600 transition-colors bg-white">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-10 w-10 text-black" />
                <div className="flex text-sm text-black">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-transparent rounded-md font-black text-emerald-600 hover:text-emerald-500">
                    <span>Choose a file</span>
                    <input id="file-upload" name="imageFile" type="file" accept="image/*" className="sr-only" />
                  </label>
                  <p className="pl-1 font-bold">or drag and drop</p>
                </div>
                <p className="text-xs text-slate-500 font-bold uppercase">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100">
            <Save className="w-5 h-5" />
            Save Design & Upload Photo
          </button>
        </div>
      </form>
    </div>
  );
}
