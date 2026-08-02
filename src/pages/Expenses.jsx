import React from 'react';
import {
  Filter,
  EllipsisVertical,
  Plus,
  Utensils,
  Bus,
  Film,
  ShoppingBag,
  Book
} from 'lucide-react';

const StatCard = ({ label, value, color }) => (
  <div className="flex flex-col items-center justify-center text-center">
    <h3 className={`text-lg font-bold ${color}`}>{value}</h3>
    <p className="text-[10px] text-text-secondary mt-1">{label}</p>
  </div>
);

const CategoryItem = ({ color, label, percent }) => (
  <div className="flex justify-between items-center text-xs">
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-text-secondary">{label}</span>
    </div>
    <span className="font-bold">{percent}</span>
  </div>
);

const TransactionItem = ({ icon, title, category, amount, date, color }) => (
  <div className="flex justify-between items-center group cursor-pointer hover:bg-dark-surface/50 p-2 -mx-2 rounded-xl transition-colors">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${color} flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-sm text-text-primary">{title}</h4>
        <p className="text-[10px] text-text-secondary">{category}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="font-bold text-sm text-text-primary">{amount}</p>
      <p className="text-[10px] text-text-secondary">{date}</p>
    </div>
  </div>
);

const Expenses = () => {
  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Expense Tracker</h1>
        <div className="flex gap-3">
          <button className="w-10 h-10 rounded-xl bg-dark-surface border border-dark-border flex items-center justify-center hover:bg-dark-border transition-colors">
            <Filter size={20} />
          </button>
          <button className="w-10 h-10 rounded-xl bg-dark-surface border border-dark-border flex items-center justify-center hover:bg-dark-border transition-colors">
            <EllipsisVertical size={20} />
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="glass-card p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider">
            This Month Overview
          </h2>
          <span className="text-xs text-text-secondary">
            May 1 - May 31, 2024
          </span>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Total Expenses"
            value="₹12,999"
            color="text-success"
          />
          <StatCard
            label="Total Income"
            value="₹18,000"
            color="text-blue-500"
          />
          <StatCard
            label="Total Budget"
            value="₹5,001"
            color="text-orange-500"
          />
          <StatCard
            label="Budget Used"
            value="72%"
            color="text-purple-500"
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Expense Categories Overview */}
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider">
              Expense Overview
            </h2>
            <button className="text-primary hover:underline text-sm font-medium">
              View All
            </button>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative w-32 h-32 flex items-center justify-center flex-shrink-0">
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-500 via-success to-red-500 flex items-center justify-center relative">
                <div className="w-20 h-20 bg-dark-surface rounded-full flex flex-col items-center justify-center z-10 border-[6px] border-dark-bg">
                  <span className="text-sm font-bold">₹12,999</span>
                  <span className="text-[8px] text-text-secondary text-center leading-tight">
                    Total
                    <br />
                    Expenses
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              <CategoryItem
                color="bg-success"
                label="Food & Dining"
                percent="28%"
              />
              <CategoryItem
                color="bg-blue-500"
                label="Transportation"
                percent="19%"
              />
              <CategoryItem
                color="bg-orange-500"
                label="Education"
                percent="17%"
              />
              <CategoryItem
                color="bg-purple-500"
                label="Shopping"
                percent="15%"
              />
              <CategoryItem
                color="bg-pink-500"
                label="Entertainment"
                percent="10%"
              />
              <CategoryItem
                color="bg-red-500"
                label="Others"
                percent="11%"
              />
            </div>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider">
              Recent Transactions
            </h2>
            <button className="text-primary hover:underline text-sm font-medium">
              View All
            </button>
          </div>
          <div className="space-y-4">
            <TransactionItem
              icon={<Utensils size={16} />}
              title="Lunch"
              category="Food & Dining"
              amount="₹250"
              date="May 18, 2024"
              color="bg-success"
            />
            <TransactionItem
              icon={<Bus size={16} />}
              title="Bus Fare"
              category="Transportation"
              amount="₹60"
              date="May 18, 2024"
              color="bg-blue-500"
            />
            <TransactionItem
              icon={<Book size={16} />}
              title="Books"
              category="Education"
              amount="₹780"
              date="May 17, 2024"
              color="bg-orange-500"
            />
            <TransactionItem
              icon={<ShoppingBag size={16} />}
              title="Groceries"
              category="Shopping"
              amount="₹950"
              date="May 17, 2024"
              color="bg-purple-500"
            />
            <TransactionItem
              icon={<Film size={16} />}
              title="Movie Tickets"
              category="Entertainment"
              amount="₹400"
              date="May 16, 2024"
              color="bg-pink-500"
            />
          </div>
        </div>
      </div>

      {/* Floating Plus Button */}
      <button className="fixed bottom-24 md:bottom-8 right-6 w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/40 hover:scale-105 transition-transform z-40">
        <Plus size={28} />
      </button>
    </div>
  );
};

export default Expenses;
