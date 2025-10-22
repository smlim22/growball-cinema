export default function LoadingSkeleton() {
  return (
    <div className="flex-1 min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md text-center">
        <div className="h-6 w-1/2 bg-gray-300 rounded mx-auto mb-4 animate-pulse" />
        <div className="h-4 w-3/4 bg-gray-200 rounded mx-auto mb-2 animate-pulse" />
        <div className="h-4 w-1/3 bg-gray-200 rounded mx-auto animate-pulse" />
      </div>
    </div>
  );
}