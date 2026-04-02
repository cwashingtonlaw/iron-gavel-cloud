import React from 'react';

interface SkeletonProps {
    className?: string;
    count?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({ className, count = 1 }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${className}`}
                />
            ))}
        </>
    );
};

export default Skeleton;
