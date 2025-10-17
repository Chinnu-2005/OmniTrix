import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Home, Clock, Star, Search, Bell, Gift, LogOut } from 'lucide-react';

interface Room {
  id: string;
  name: string;
  lastModified: string;
  owner: string;
  thumbnail: string;
}

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedView, setSelectedView] = useState<'home' | 'recent' | 'starred'>('home');

  // Sample past rooms data (with thumbnail images)
  const [rooms] = useState<Room[]>([
    {
      id: '1',
      name: 'My First Canvas',
      lastModified: 'Today',
      owner:  'You',
      thumbnail: 'data:image/png;base64,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',
    },
    {
      id: '2',
      name: 'Team Brainstorm',
      lastModified: 'Yesterday',
      owner: 'You',
      thumbnail: 'data:image/png;base64,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',
    },
    {
      id: '3',
      name: 'Project Planning',
      lastModified: '2 days ago',
      owner: 'You',
      thumbnail: 'data:image/png;base64,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',
    },
  ]);

  const handleCreateRoom = () => {
    console.log('Create new room');
  };

  const handleOpenRoom = (roomId: string) => {
    console.log('Open room:', roomId);
  };

  return (
    <div className="min-h-screen flex bg-white text-[17px] leading-relaxed">
      {/* Sidebar */}
      <aside className="w-72 border-r border-gray-200 bg-gray-50 flex flex-col text-[17px]">
        {/* User Profile Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
              { 'U'}
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-gray-800 text-[18px]">
                {'User'}
              </h2>
              <p className="text-[14px] text-gray-500">Free Account</p>
            </div>
            <button
              onClick={signOut}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title or topic"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-[16px] focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200 transition-all"
              style={{ fontFamily: "'Inter', 'SF Pro Display', sans-serif" }}
            />
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setSelectedView('home')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[16px] font-medium transition-all ${
              selectedView === 'home'
                ? 'bg-orange-100 text-orange-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Home className="w-5 h-5" />
            Home
          </button>

          <button
            onClick={() => setSelectedView('recent')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[16px] font-medium transition-all ${
              selectedView === 'recent'
                ? 'bg-orange-100 text-orange-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Clock className="w-5 h-5" />
            Recent
          </button>

          <button
            onClick={() => setSelectedView('starred')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[16px] font-medium transition-all ${
              selectedView === 'starred'
                ? 'bg-orange-100 text-orange-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Star className="w-5 h-5" />
            Starred
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col text-[17px]">
        {/* Navbar */}
        <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-800">XLR8</h1>
            <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-600 text-sm font-semibold rounded">
              Free
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Gift className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-md cursor-pointer">
              {'U'}
            </div>
          </div>
        </header>

        {/* Content */}
        <div
          className="flex-1 overflow-auto"
          style={{
            background: `
              radial-gradient(circle at 20% 30%, rgba(255, 237, 213, 0.6) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(254, 215, 170, 0.5) 0%, transparent 50%),
              linear-gradient(135deg, #fff5eb 0%, #fef3e7 25%, #fffaf5 50%)
            `,
          }}
        >
          <div className="p-10 space-y-10">
            {/* Quick Start Templates */}
            <section>
              <div className="flex gap-6 overflow-x-auto pb-4">
                {/* Blank Canvas */}
                <button
                  onClick={handleCreateRoom}
                  className="flex-shrink-0 w-60 h-60 bg-white rounded-2xl border-2 border-gray-200 hover:border-orange-400 hover:shadow-lg transition-all flex flex-col items-center justify-center gap-2 "
                >
                  <img src="data:image/jpeg;base64,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" alt="Blank Canvas" className="w-30 h-30 rounded-lg" />
                  <span className="text-base font-semibold text-gray-700">Blank Canvas</span>
                </button>

                {/* Flowchart */}
                <div className="flex-shrink-0 w-60 h-60 bg-white rounded-2xl border-2 border-gray-200 hover:border-orange-400 hover:shadow-lg transition-all flex flex-col items-center justify-center gap-2 cursor-pointer">
                  <img src="https://cdn.sanity.io/images/599r6htc/regionalized/4a7f55a681e0fa8db4377594c54506d1896a68b2-1440x850.png?w=1440&h=850&q=75&fit=max&auto=format" alt="Flowchart" className=" w-30 h -30 rounded-lg" />
                  <span className="text-base font-semibold text-gray-700">Flowchart</span>
                </div>

                {/* Mind Map */}
                <div className="flex-shrink-0 w-60 h-60 bg-white rounded-2xl border-2 border-gray-200 hover:border-orange-400 hover:shadow-lg transition-all flex flex-col items-center justify-center gap-2 cursor-pointer">
                  <img src="data:image/jpeg;base64,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" alt="Mind Map" className=" w-30h -130rounded-lg" />
                  <span className="text-base font-semibold text-gray-700">Mind Map</span>
                </div>

                {/* Retrospective */}
                {/* <div className="flex-shrink-0 w-60 h-60 bg-white rounded-2xl border-2 border-gray-200 hover:border-orange-400 hover:shadow-lg transition-all flex flex-col items-center justify-center gap-2 cursor-pointer">
                  <img src="/images/team.jpg" alt="Retrospective" className=" w-30h -130rounded-lg" />
                  <span className="text-base font-semibold text-gray-700">Quick Retrospective</span>
                </div> */}
              </div>
            </section>

            {/* Past Rooms */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Past Rooms</h2>
                <button
                  onClick={handleCreateRoom}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-semibold text-[16px] shadow-md hover:shadow-lg hover:scale-105 transition-all"
                >
                  Create Room
                </button>
              </div>

              {/* Rooms Table */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-[16px] font-semibold text-gray-700">Name</th>
                      <th className="text-left px-6 py-4 text-[16px] font-semibold text-gray-700">Last opened</th>
                      <th className="text-left px-6 py-4 text-[16px] font-semibold text-gray-700">Owner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map((room) => (
                      <tr
                        key={room.id}
                        className="border-b border-gray-100 hover:bg-orange-50 transition-colors cursor-pointer"
                        onClick={() => handleOpenRoom(room.id)}
                      >
                        <td className="px-6 py-4 flex items-center gap-4">
                          <img src={room.thumbnail} alt={room.name} className="w-12 h-12 rounded-lg object-cover" />
                          <div>
                            <p className="font-semibold text-gray-800 text-[16px]">{room.name}</p>
                            <p className="text-sm text-gray-500">Modified {room.lastModified}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-[15px]">{room.lastModified}</td>
                        <td className="px-6 py-4 text-gray-600 text-[15px]">{room.owner}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};
