import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon } from './icons';

const Breadcrumbs: React.FC = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    if (pathnames.length === 0 || (pathnames.length === 1 && pathnames[0] === 'dashboard')) {
        return null;
    }

    return (
        <nav className="flex items-center text-sm text-slate-500 mb-4" aria-label="Breadcrumb">
            <Link to="/dashboard" className="hover:text-blue-600 flex items-center">
                <HomeIcon className="w-4 h-4" />
            </Link>
            {pathnames.map((value, index) => {
                const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                const isLast = index === pathnames.length - 1;
                const label = value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');

                return (
                    <React.Fragment key={to}>
                        <ChevronRightIcon className="w-4 h-4 mx-2 text-slate-400" />
                        {isLast ? (
                            <span className="font-medium text-slate-800 dark:text-slate-200">{label}</span>
                        ) : (
                            <Link to={to} className="hover:text-blue-600">
                                {label}
                            </Link>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};

export default Breadcrumbs;
