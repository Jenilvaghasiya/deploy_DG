import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  fetchTimeOnPlatform,
  fetchUsageTime,
  fetchOutputStats,
  fetchCreditConsumption,
  fetchActivityLog,
} from "../features/dashboard/dashboardService";
import { fetchUsers, fetchTenants } from "../features/dashboard/useService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  CalendarIcon,
  Clock,
  Users,
  CreditCard,
  Activity,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import { formatMinutes } from "@/lib/utils";
import TimeRangeFilter from "@/components/dashboard/TimeRangeFilter";
import ActivityLogTable from "@/components/dashboard/ActivityLogTable";

// Constants
const PAGE_SIZE = 10;

// Color palette
const COLORS = {
  primary: "#8b5cf6",
  secondary: "#ec4899",
  accent: "#06b6d4",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  chart: [
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#3b82f6",
    "#a855f7",
  ],
};

const TYPE_LABELS = {
  text_to_image: "Text to Image",
  image_variation: "Image Variation",
  combine_image: "Combine Image",
  sketch_to_image: "Sketch to Image",
  size_chart: "Size Chart",
  pattern_cutout: "Pattern Cutout",
  color_analysis: "Color Analysis",
  tech_packs: "Tech Packs",
  color_variations: "Color Variations",
};

// Custom hook for handling clicks outside
const useOutsideClick = (callback) => {
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [callback]);

  return ref;
};

// Multi-select User Dropdown Component
const MultiSelectUserDropdown = ({
  users,
  selectedUsers,
  onUserChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useOutsideClick(() => setIsOpen(false));

  const handleUserClick = useCallback(
    (userId) => {
      if (userId === "all") {
        onUserChange(["all"]);
        return;
      }

      let newUsers;
      if (selectedUsers.includes("all")) {
        newUsers = [userId];
      } else {
        newUsers = selectedUsers.includes(userId)
          ? selectedUsers.filter((id) => id !== userId)
          : [...selectedUsers, userId];
      }

      if (newUsers.length === 0) {
        newUsers = ["all"];
      }

      onUserChange(newUsers);
    },
    [selectedUsers, onUserChange]
  );

  const displayText = useMemo(() => {
    if (selectedUsers.includes("all")) return "All Users";
    if (selectedUsers.length === 1) {
      const user = users.find((u) => u.id === selectedUsers[0]);
      return user?.full_name || "1 User";
    }
    return `${selectedUsers.length} Users`;
  }, [selectedUsers, users]);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="dg_btn"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-[200px] justify-between bg-black/20 backdrop-blur-sm border-white/10 text-white hover:bg-black/30",
          className
        )}
      >
        <span className="truncate">{displayText}</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 ml-2 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
        )}
      </Button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-64 bg-black/50 backdrop-blur-2xl border border-white/10 rounded-lg shadow-lg">
          <div className="max-h-80 overflow-y-auto custom-scroll">
            <div className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 cursor-pointer border-b border-white/10" onClick={() => handleUserClick("all")}>
              <div className="w-4 h-4 border border-white/40 rounded flex items-center justify-center">{selectedUsers.includes("all") && (<Check className="h-3 w-3 text-white" />)}</div>
              <span className="text-white">All Users</span>
            </div>

            {users.map((user) => (
              <div key={user.id} className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 cursor-pointer" onClick={() => handleUserClick(user.id)}>
                <div className="w-4 h-4 border border-white/40 rounded flex items-center justify-center">{selectedUsers.includes(user.id) && (<Check className="h-3 w-3 text-white" />)}</div>
                <span className="text-white truncate">{user.full_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Multi-select Type Dropdown Component
const MultiSelectTypeDropdown = ({
  selectedTypes,
  onTypeChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useOutsideClick(() => setIsOpen(false));

  const handleTypeClick = useCallback(
    (typeValue) => {
      if (typeValue === "all") {
        onTypeChange(["all"]);
        return;
      }

      let newTypes;
      if (selectedTypes.includes("all")) {
        newTypes = [typeValue];
      } else {
        newTypes = selectedTypes.includes(typeValue)
          ? selectedTypes.filter((t) => t !== typeValue)
          : [...selectedTypes, typeValue];
      }

      if (newTypes.length === 0) {
        newTypes = ["all"];
      }

      onTypeChange(newTypes);
    },
    [selectedTypes, onTypeChange]
  );

  const displayText = useMemo(() => {
    if (selectedTypes.includes("all")) return "All Types";
    if (selectedTypes.length === 1) {
      return TYPE_LABELS[selectedTypes[0]] || selectedTypes[0];
    }
    return `${selectedTypes.length} Types`;
  }, [selectedTypes]);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="dg_btn"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-[200px] justify-between bg-black/20 backdrop-blur-sm border-white/10 text-white hover:bg-black/30",
          className
        )}
      >
        <span className="truncate">{displayText}</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 ml-2 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
        )}
      </Button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-56 bg-black/50 backdrop-blur-2xl border border-white/10 rounded-lg shadow-lg p-3 px-2.5">
          <div className="max-h-80 overflow-y-auto custom-scroll">
            <div className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 cursor-pointer border-b border-white/10" onClick={() => handleTypeClick("all")}>
              <div className="w-4 h-4 border border-white/40 rounded flex items-center justify-center">{selectedTypes.includes("all") && (<Check className="h-3 w-3 text-white" />)}</div>
              <span className="text-white">All Types</span>
            </div>

            {Object.entries(TYPE_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 cursor-pointer" onClick={() => handleTypeClick(key)}>
                <div className="w-4 h-4 border border-white/40 rounded flex items-center justify-center">
                  {selectedTypes.includes(key) && (<Check className="h-3 w-3 text-white" />)}
                </div>
                <span className="text-white">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/20 backdrop-blur-sm border-white/10 text-white rounded-lg p-3 shadow-lg">
        <p className="text-white font-medium mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatter ? formatter(entry.value) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, trend, color = "primary" }) => (
  <Card className="bg-black/20 backdrop-blur-sm border-white/10 text-white">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-zinc-400">
        {title}
      </CardTitle>
      <Icon className={`h-4 w-4 text-${color}-500`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-white">{value}</div>
      {trend && (
        <p
          className={`text-xs ${
            trend > 0 ? "text-green-500" : "text-red-500"
          }`}
        >
          {trend > 0 ? "+" : ""}
          {trend}% from last period
        </p>
      )}
    </CardContent>
  </Card>
);

export default function DashboardNew() {
  // State
  const [platformData, setPlatformData] = useState([]);
  const [timeData, setTimeData] = useState([]);
  const [outputData, setOutputData] = useState([]);
  const [creditData, setCreditData] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Multi-select states
  const [selectedUsers, setSelectedUsers] = useState(["all"]);
  const [selectedTypes, setSelectedTypes] = useState(["all"]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });

  // Add time range state
  const [timeRange, setTimeRange] = useState({
    startTime: "00:00:00",
    endTime: "23:59:59",
  });

  // Pagination calculations
  const totalPages = Math.ceil(activityData.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedData = activityData.slice(startIndex, startIndex + PAGE_SIZE);

  // Update the fetchData useEffect to include activity log
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Convert arrays to comma-separated strings for API
        const usersParam = selectedUsers.includes("all") 
          ? "all" 
          : selectedUsers.join(",");
        
        const typeParam = selectedTypes.includes("all") 
          ? "all" 
          : selectedTypes.join(",");

        const params = {
          users: usersParam,
          type: typeParam,
          startDate: format(dateRange.from, "yyyy-MM-dd"),
          endDate: format(dateRange.to, "yyyy-MM-dd"),
          startTime: timeRange.startTime,
          endTime: timeRange.endTime,
        };

        const [platform, time, output, credit, activity, usersData] =
          await Promise.all([
            fetchTimeOnPlatform(params),
            fetchUsageTime(params),
            fetchOutputStats(params),
            fetchCreditConsumption(params),
            fetchActivityLog(params),
            fetchUsers(""),
          ]);

        setPlatformData(platform);
        setTimeData(time[0]?.subCategories || []);
        setOutputData(output[0]?.subCategories || []);
        setCreditData(credit[0]?.subCategories || []);
        setActivityData(activity);
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [selectedUsers, selectedTypes, dateRange, timeRange]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedUsers, selectedTypes, dateRange, timeRange]);

  // Pagination handlers
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Calculate stats
  const stats = useMemo(() => {
    const totalTime = platformData.reduce((acc, item) => acc + item.value, 0);
    const totalOutputs = outputData.reduce(
      (acc, item) => acc + item.generated + item.discarded,
      0
    );
    const totalCredits = creditData.reduce(
      (acc, item) => acc + item.generated + item.discarded,
      0
    );
    const activeUsers = platformData.length;

    return { totalTime, totalOutputs, totalCredits, activeUsers };
  }, [platformData, outputData, creditData]);

  // Transform data for charts
  const pieChartData = useMemo(() => {
    return timeData
      .filter((item) => item.time > 0)
      .map((item, index) => ({
        name: TYPE_LABELS[item.title] || item.title,
        value: item.time,
        color: COLORS.chart[index % COLORS.chart.length],
      }));
  }, [timeData]);

  const radarChartData = useMemo(() => {
    return outputData.map((item) => ({
      type: TYPE_LABELS[item.title] || item.title,
      generated: item.generated,
      discarded: item.discarded,
    }));
  }, [outputData]);

  const combinedBarData = useMemo(() => {
    return outputData.map((item, index) => ({
      name: TYPE_LABELS[item.title] || item.title,
      outputs: item.generated + item.discarded,
      credits:
        (creditData[index]?.generated || 0) +
        (creditData[index]?.discarded || 0),
    }));
  }, [outputData, creditData]);

  return (
    <div className="text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-white">
          Dashboard Overview
        </h1>
        <p className="text-gray-300">
          Monitor your platform usage and performance metrics
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <MultiSelectUserDropdown
          users={users}
          selectedUsers={selectedUsers}
          onUserChange={setSelectedUsers}
        />

        <MultiSelectTypeDropdown
          selectedTypes={selectedTypes}
          onTypeChange={setSelectedTypes}
        />

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="dg_btn" className="w-72 justify-start text-left font-normal bg-black/20 backdrop-blur-sm border-white/10 text-white hover:bg-black/30">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {dateRange.from.toLocaleDateString()} -{" "}
                    {dateRange.to.toLocaleDateString()}
                  </>
                ) : (
                  dateRange.from.toLocaleDateString()
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-black/15 backdrop-blur-2xl border-white/10" align="start">
            <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} className="!bg-transparent text-white" />
          </PopoverContent>
        </Popover>
        <TimeRangeFilter startTime={timeRange.startTime} endTime={timeRange.endTime} onStartTimeChange={(time) => setTimeRange((prev) => ({ ...prev, startTime: time }))} onEndTimeChange={(time) => setTimeRange((prev) => ({ ...prev, endTime: time }))} />
      </div>

      {/* Rest of your component remains the same... */}
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Platform Time"
          value={formatMinutes(stats.totalTime)}
          icon={Clock}
          color="primary"
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          icon={Users}
          color="secondary"
        />
        <StatCard
          title="Total Outputs"
          value={stats.totalOutputs}
          icon={Activity}
          color="accent"
        />
        <StatCard
          title="Credits Used"
          value={stats.totalCredits}
          icon={CreditCard}
          color="warning"
        />
      </div>

      {/* Charts Grid - rest of your charts remain the same */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Usage by User */}
        <Card className="bg-black/20 backdrop-blur-sm border border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Platform Usage by User</CardTitle>
            <CardDescription className="text-gray-300">
              Time spent on platform per user
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={platformData.slice(0, 8)}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: "#9ca3af" }}
                  tickFormatter={(value) => {
                    const minutes = Math.round(value / 1000 / 60);
                    if (minutes < 60) {
                      return `${minutes}m`;
                    } else {
                      const hours = Math.floor(minutes / 60);
                      const mins = minutes % 60;
                      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
                    }
                  }}
                />
                <Tooltip
                  content={
                    <CustomTooltip
                      formatter={(value) => formatMinutes(value)}
                    />
                  }
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {platformData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS.chart[index % COLORS.chart.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Rest of your charts... */}
        {/* Usage Distribution */}
        <Card className="bg-black/20 backdrop-blur-sm border border-white/10">
          <CardHeader>
            <CardTitle className="text-white">
              Usage Distribution by Type
            </CardTitle>
            <CardDescription className="text-gray-300">
              Time spent on different features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={
                    <CustomTooltip
                      formatter={(value) => formatMinutes(value)}
                    />
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Output Analysis */}
        <Card className="bg-black/20 backdrop-blur-sm border border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Output Analysis</CardTitle>
            <CardDescription className="text-gray-300">
              Generated vs Discarded outputs by type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarChartData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis
                  dataKey="type"
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, "auto"]}
                  tick={{ fill: "#9ca3af" }}
                />
                <Radar
                  name="Generated"
                  dataKey="generated"
                  stroke={COLORS.primary}
                  fill={COLORS.primary}
                  fillOpacity={0.6}
                />
                <Radar
                  name="Discarded"
                  dataKey="discarded"
                  stroke={COLORS.danger}
                  fill={COLORS.danger}
                  fillOpacity={0.6}
                />
                <Legend wrapperStyle={{ color: "#fff" }} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Outputs vs Credits */}
        <Card className="bg-black/20 backdrop-blur-sm border border-white/10">
          <CardHeader>
            <CardTitle className="text-white">
              Outputs vs Credits Consumption
            </CardTitle>
            <CardDescription className="text-gray-300">
              Comparison of outputs generated and credits used
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={combinedBarData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                />
                <YAxis tick={{ fill: "#9ca3af" }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: "#fff" }} />
                <Bar
                  dataKey="outputs"
                  fill={COLORS.primary}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="credits"
                  fill={COLORS.secondary}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Time Trend Analysis */}
        <Card className="bg-black/20 backdrop-blur-sm border border-white/10 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Feature Usage Trends</CardTitle>
            <CardDescription className="text-gray-300">
              Time spent on each feature type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={timeData.map((item) => ({
                  name: TYPE_LABELS[item.title] || item.title,
                  time: Math.round(item.time / 1000 / 60),
                }))}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                />
                <YAxis tick={{ fill: "#9ca3af" }} />
                <Tooltip
                  content={
                    <CustomTooltip formatter={(value) => `${value} minutes`} />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="time"
                  stroke={COLORS.accent}
                  strokeWidth={2}
                  dot={{ fill: COLORS.accent, r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Summary Metrics */}
        <Card className="bg-black/20 backdrop-blur-sm border border-white/10 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Performance Summary</CardTitle>
            <CardDescription className="text-gray-300">
              Key metrics overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-black/20 backdrop-blur-sm border-white/10 text-white rounded-lg p-4">
                <p className="text-sm text-gray-300 mb-1">Most Used Feature</p>
                <p className="text-lg font-semibold text-white">
                  {timeData.length > 0
                    ? TYPE_LABELS[
                        timeData.reduce(
                          (max, item) => (item.time > max.time ? item : max),
                          timeData[0]
                        ).title
                      ]
                    : "N/A"}
                </p>
              </div>

              <div className="bg-black/20 backdrop-blur-sm border-white/10 text-white rounded-lg p-4">
                <p className="text-sm text-gray-300 mb-1">Avg. Session Time</p>
                <p className="text-lg font-semibold text-white">
                  {platformData.length > 0
                    ? formatMinutes(
                        Math.round(stats.totalTime / platformData.length)
                      )
                    : "0m"}
                </p>
              </div>

              <div className="bg-black/20 backdrop-blur-sm border-white/10 text-white rounded-lg p-4">
                <p className="text-sm text-gray-300 mb-1">
                  Output Success Rate
                </p>
                <p className="text-lg font-semibold text-white">
                  {outputData.length > 0
                    ? `${Math.round(
                        (outputData.reduce(
                          (acc, item) => acc + item.generated,
                          0
                        ) /
                          (outputData.reduce(
                            (acc, item) =>
                              acc + item.generated + item.discarded,
                            0
                          ) || 1)) *
                          100
                      )}%`
                    : "0%"}
                </p>
              </div>

              <div className="bg-black/20 backdrop-blur-sm border-white/10 text-white rounded-lg p-4">
                <p className="text-sm text-gray-300 mb-1">Credit Efficiency</p>
                <p className="text-lg font-semibold text-white">
                  {stats.totalOutputs > 0
                    ? `${(stats.totalCredits / stats.totalOutputs).toFixed(
                        2
                      )} credits/output`
                    : "0"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Log Table */}
        <Card className="bg-black/20 backdrop-blur-sm border border-white/10 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Activity Log</CardTitle>
            <CardDescription className="text-gray-300">
              Recent platform activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <ActivityLogTable paginatedData={paginatedData} />
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-6">
              <Button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className={cn(
                  "bg-black/20 border-white/10 text-white hover:bg-black/30",
                  currentPage === 1 && "opacity-50 cursor-not-allowed"
                )}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              <span className="text-sm text-gray-300">
                Page {currentPage} of {totalPages || 1}
              </span>

              <Button
                onClick={handleNextPage}
                disabled={currentPage === totalPages || totalPages === 0}
                variant="outline"
                size="sm"
                className={cn(
                  "bg-black/20 border-white/10 text-white hover:bg-black/30 hover:text-white",
                  (currentPage === totalPages || totalPages === 0) &&
                    "opacity-50 cursor-not-allowed"
                )}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}