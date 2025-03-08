import ImageEditor from "../components/ImageEditor";

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto" >
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2" >MaskUp</h1>
          <p className="text-gray-600">A background effect generator tool</p>
        </div>
        <ImageEditor />
      </div>
    </main>
  );
}
