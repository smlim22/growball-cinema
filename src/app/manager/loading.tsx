export default function Loading() {
  return (
    <div className="p-10 px-12 font-inter min-h-screen bg-gray-100 animate-[fadeIn_0.3s_ease-out]">

      {/* Top Welcome Text Skeleton */}
      <div className="h-6 w-48 bg-gray-300 rounded-md mb-6 animate-pulse"></div>

      {/* Two Cards Row */}
      <div className="flex gap-4 mb-10">
        <div className="bg-white p-4 rounded-md shadow-md w-64 h-32 animate-pulse">
          <div className="h-5 w-40 bg-gray-300 rounded mb-4"></div>
          <div className="h-6 w-12 bg-gray-300 rounded"></div>
        </div>

        <div className="bg-white p-4 rounded-md shadow-md w-64 h-32 animate-pulse">
          <div className="h-5 w-52 bg-gray-300 rounded mb-4"></div>
          <div className="h-6 w-12 bg-gray-300 rounded"></div>
        </div>
      </div>

      {/* Dashboard Title */}
      <div className="h-6 w-36 bg-gray-300 rounded-md mb-6 animate-pulse"></div>

      {/* Two Summary Cards */}
      <div className="flex gap-4">

        <div className="bg-white p-4 rounded-md shadow-md w-[380px] h-[170px] animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-5 w-40 bg-gray-300 rounded"></div>
          </div>
          <div className="h-10 w-48 bg-gray-300 rounded"></div>
        </div>

        <div className="bg-white p-4 rounded-md shadow-md w-[380px] h-[170px] animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-5 w-52 bg-gray-300 rounded"></div>
          </div>
          <div className="h-10 w-48 bg-gray-300 rounded"></div>
        </div>

      </div>
    </div>
  );
}