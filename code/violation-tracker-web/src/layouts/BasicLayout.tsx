import { useStores } from '@/models';
// import { RoutedProps } from '@/router';
import { useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Nav from '../components/Nav';
import HistoryContext, { THistory } from '../pages/historyContext';

const BasicLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const history = useMemo(
    () =>
      ({
        goBack: () => navigate(-1),
        push: (val) => {
          navigate(val);
        },
        replace: (url) => {
          navigate(url, { replace: true });
        },
      } as THistory),
    [navigate],
  );
  const { userStore } = useStores();

  useEffect(() => {
    if (!userStore.login) navigate('/login');
  }, [navigate, userStore.login]);

  return (
    <HistoryContext.Provider value={{ history, navigate, location }}>
      <Nav />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
    </HistoryContext.Provider>
  );
};

export default BasicLayout;
