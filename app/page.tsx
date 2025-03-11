import ImageEditor from "../components/ImageEditor";

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-50 font-mono">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center gap-5">
              <img src="/MaskUpLogo.png" alt="" className="h-15" />
              <h1 className="text-3xl md:text-4xl font-bold">
                MaskUp
              </h1>
            </div>
          </div>
          <p className="text-gray-600">
            A background effect generator tool
          </p>
        </div>
        <ImageEditor />
      </div>
    </main>
  );
}
