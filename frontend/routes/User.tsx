import { useSearchParams } from 'react-router-dom';
import UserDashboard from '../components/userdashboard/Index';

export default function User() {
  const [searchParams] = useSearchParams();
  const chatId = searchParams.get('from');

  return (
    <section className="flex w-full h-full">      
      <UserDashboard chatId={chatId} />
    </section>
  );
}