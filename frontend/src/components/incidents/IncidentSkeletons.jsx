import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export const IncidentListSkeleton = ({ count = 5 }) => {
  return (
    <div className="space-y-4">
      {Array(count).fill(0).map((_, i) => (
        <div key={i} className="p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-200">
          <div className="flex items-start gap-4">
            <Skeleton circle height={48} width={48} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <Skeleton width={120} height={20} />
                <div className="flex gap-2">
                  <Skeleton width={60} height={16} />
                  <Skeleton width={60} height={16} />
                </div>
              </div>
              <Skeleton count={1} />
              <div className="flex items-center gap-3 mt-4">
                <Skeleton width={80} height={12} />
                <Skeleton width={80} height={12} />
                <Skeleton width={120} height={12} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const IncidentDetailSkeleton = () => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 space-y-6">
      <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="space-y-2">
          <Skeleton width={150} height={24} />
          <Skeleton width={100} height={16} />
        </div>
        <Skeleton circle width={32} height={32} />
      </div>
      
      <div className="space-y-2">
        <Skeleton width={60} height={12} />
        <Skeleton height={20} width="80%" />
      </div>

      <div className="space-y-2">
        <Skeleton width={60} height={12} />
        <Skeleton height={60} />
      </div>

      <div className="space-y-2">
        <Skeleton width={60} height={12} />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton height={100} />
          <Skeleton height={100} />
        </div>
      </div>

      <div className="space-y-4 pt-6">
        <Skeleton height={40} className="rounded-xl" />
        <Skeleton height={40} className="rounded-xl" />
      </div>
    </div>
  );
};
