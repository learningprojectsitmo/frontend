import { ContentLayout } from '@/components/layouts';
import { useUser } from '@/lib/auth';
import { 
  BookOpen, 
  Users, 
  LayoutGrid, 
  Plus, 
  Settings, 
  Search,
  Bell
} from 'lucide-react'; // Используем иконки для современности

const DashboardRoute = () => {
  const user = useUser();

  // Имитация данных из макета (в будущем придет из API)
  const spaces = [
    { title: 'Управление проектами', projects: 8, members: 24, color: 'bg-blue-500', category: 'Дисциплина' },
    { title: 'Проектная деятельность', projects: 5, members: 12, color: 'bg-indigo-500', category: 'Дисциплина' },
    { title: 'Управление процессами', projects: 12, members: 128, color: 'bg-red-500', category: 'Дисциплина' },
  ];

  return (
    <ContentLayout title="Все пространства">
      <div className="max-w-7xl mx-auto p-6">
        
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Все пространства</h1>
            <p className="text-gray-500 text-sm">
              Управляйте своими образовательными проектами и инициативами
            </p>
          </div>
          <button className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
            <Plus size={18} />
            Создать проект
          </button>
        </div>

        {/* Spaces Grid */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Ваши пространства</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {spaces.map((space, idx) => (
              <div key={idx} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className={`${space.color} p-3 rounded-lg text-white`}>
                    <BookOpen size={24} />
                  </div>
                  <span className="text-xs font-medium bg-gray-50 text-gray-500 px-2 py-1 rounded border">
                    {space.category}
                  </span>
                </div>
                
                <h3 className="font-bold text-lg mb-2">{space.title}</h3>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                  Проекты по планированию, организации и контролю проектной работы...
                </p>

                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <LayoutGrid size={16} />
                    <span>{space.projects} проектов</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users size={16} />
                    <span>{space.members} участника</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Projects Section (Simplified) */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Недавние проекты</h2>
            <div className="flex gap-2">
               <button className="p-2 bg-gray-100 rounded-md"><LayoutGrid size={18}/></button>
               <button className="p-2 text-gray-400"><Settings size={18}/></button>
            </div>
          </div>
          
          <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">AI</div>
                <div>
                  <h4 className="font-medium">AI Learning Platform</h4>
                  <p className="text-xs text-gray-400 font-normal">Разработка цифровой платформы с ИИ</p>
                </div>
             </div>
             <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full">В РАБОТЕ</span>
          </div>
        </section>

      </div>
    </ContentLayout>
  );
};

export default DashboardRoute;