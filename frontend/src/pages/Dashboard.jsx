/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  fetchTimeOnPlatform,
  fetchUsageTime,
  fetchOutputStats,
  fetchCreditConsumption,
  fetchActivityLog,
} from "../features/dashboard/dashboardService";
import { fetchUsers, fetchTenants } from "../features/dashboard/useService";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import DateRangeFilter from "../components/dashboard/DateRangeFilter";
import TimeRangeFilter from "../components/dashboard/TimeRangeFilter";
import GroupedBarChart from "./Chart";
import { PlatformBarChartCard } from "./ChartNew";
import { formatMinutes, hasPermission } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import useSocket from "@/hooks/useSocket";
import { PERMISSIONS } from "@/utils/permission";
import PlatformTotalBarChart from "@/components/Chart/PlatformTotalBarChart";
import OutputSummaryBarChart from "@/components/OutputSummaryBarChart";
import ActivityLogTable from "@/components/dashboard/ActivityLogTable";
import { BAR_LABELS } from "@/constants/dashboard";

// Constants
const PAGE_SIZE = 10;
const CHART_CONFIG = {
  generated: { label: "Generated", color: "#EE1B23" },
  discarded: { label: "Discarded", color: "#00A3EB" },
  time: { label: "Time", color: "#FFFFFF" },
};

const TYPE_OPTIONS = [
  { value: "all", label: "All Types", color: "bg-gray-400" },
  { value: "image_variation", label: "Image Variation", color: "bg-pink-500" },
  { value: "sketch_to_image", label: "Sketch to Image", color: "bg-blue-500" },
  { value: "combine_image", label: "Combine Image", color: "bg-green-500" },
  { value: "size_chart", label: "Size Chart", color: "bg-yellow-500" },
  { value: "text_to_image", label: "Text to Image", color: "bg-purple-500" },
  { value: "pattern_cutout", label: "Pattern Cutout", color: "bg-red-400" },
  { value: "color_analysis", label: "Color Analysis", color: "bg-orange-400" },
  { value: "tech_packs", label: "Tech Packs", color: "bg-teal-400" },
  { value: "color_variations", label: "Color Variation", color: "bg-indigo-400" },
];

// Utility functions
const transformChartData = (outputData) =>
  outputData.flatMap((item) =>
    item.subCategories.map((sub, index) => ({
      name: item.name,
      title: BAR_LABELS[sub.title] || sub.title,
      generated: sub.generated,
      discarded: sub.discarded,
      groupIndex: Math.floor(index / outputData[0].subCategories.length),
    }))
  );

const transformTimeData = (outputData) =>
  outputData.flatMap((item) =>
    item.subCategories.map((sub, index) => ({
      name: item.name,
      title: BAR_LABELS[sub.title] || sub.title,
      time: sub.time,
      discarded: 0,
      groupIndex: Math.floor(index / outputData[0].subCategories.length),
    }))
  );

const getTotalData = (platformData) => [
  {
    name: "Total",
    value: platformData.reduce((acc, item) => acc + item.value, 0),
  },
];

// Custom Hooks
const useOutsideClick = (callback) => {
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [callback]);

  return ref;
};

const useDropdowns = () => {
  const [dropdowns, setDropdowns] = useState({
    platformUsers: false,
    timeUsers: false,
    timeType: false,
    outputUsers: false,
    outputType: false,
    outputUsers2: false,
    outputType2: false,
    creditUsers: false,
    creditType: false,
    activityUsers: false,
    outputUsers3: false,
    outputType3: false,
    outputUsers4: false,
    outputType4: false,
  });

  const toggleDropdown = useCallback((key) => {
    setDropdowns(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const closeDropdown = useCallback((key) => {
    setDropdowns(prev => ({ ...prev, [key]: false }));
  }, []);

  return { dropdowns, toggleDropdown, closeDropdown };
};

const useFilters = () => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [dateTimeFilters, setDateTimeFilters] = useState({
    startDate: firstDayOfMonth.toISOString().split("T")[0],
    endDate: today.toISOString().split("T")[0],
    startTime: "00:00:00",
    endTime: "23:59:59",
  });

  const [chartFilters, setChartFilters] = useState({
    platform: { users: ["all"] },
    time: { users: ["all"], type: ["all"] },
    output: { users: ["all"], type: ["all"] },
    output2: { users: ["all"], type: ["all"] },
    output3: { users: ["all"], type: ["all"] },
    output4: { users: ["all"], type: ["all"] },
    credit: { users: ["all"], type: ["all"] },
    activity: { users: ["all"] },
  });

  return { dateTimeFilters, setDateTimeFilters, chartFilters, setChartFilters };
};

// Components
const TypeFilterDropdown = ({
  currentFilter,
  onFilterChange,
  dropdownKey,
  isOpen,
  toggleDropdown,
  closeDropdown,
}) => {
  const dropdownRef = useOutsideClick(() => {
    if (isOpen) closeDropdown(dropdownKey);
  });

  const selectedTypes = Array.isArray(currentFilter) ? currentFilter : [currentFilter];

  const handleTypeClick = useCallback((typeValue) => {
    if (typeValue === "all") {
      onFilterChange(["all"]);
      return;
    }

    let newTypes;
    if (selectedTypes.includes("all")) {
      newTypes = [typeValue];
    } else {
      newTypes = selectedTypes.includes(typeValue)
        ? selectedTypes.filter(t => t !== typeValue)
        : [...selectedTypes, typeValue];
    }

    onFilterChange(newTypes.length === 0 ? ["all"] : newTypes);
  }, [selectedTypes, onFilterChange]);

  const displayText = useMemo(() => {
    if (selectedTypes.includes("all")) return "All Types";
    if (selectedTypes.length === 1) {
      const option = TYPE_OPTIONS.find(opt => opt.value === selectedTypes[0]);
      return option?.label || selectedTypes[0];
    }
    return `${selectedTypes.length} Types`;
  }, [selectedTypes]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => toggleDropdown(dropdownKey)}
        className="flex items-center gap-2 bg-zinc-800 py-2 px-4 rounded-lg text-white text-sm border border-zinc-700 hover:bg-zinc-700 transition-colors"
      >
        <span>{displayText}</span>
        {isOpen ? <FaChevronUp className="text-gray-400 text-xs" /> : <FaChevronDown className="text-gray-400 text-xs" />}
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 left-0 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg w-48">
          {TYPE_OPTIONS.map((option) => (
            <div
              key={option.value}
              className="flex items-center gap-2 px-4 py-2 hover:bg-zinc-700 cursor-pointer"
              onClick={() => handleTypeClick(option.value)}
            >
              <input
                type="checkbox"
                checked={selectedTypes.includes(option.value)}
                readOnly
                className="h-4 w-4 accent-pink-500"
              />
              <div className={`w-3 h-3 rounded-full ${option.color}`} />
              <span className="text-white">{option.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const UserFilterDropdown = ({
  users,
  selectedUsers,
  onUserFilter,
  dropdownKey,
  isOpen,
  toggleDropdown,
  closeDropdown,
  getUserName,
  position = "right",
}) => {
  const dropdownRef = useOutsideClick(() => {
    if (isOpen) closeDropdown(dropdownKey);
  });

  const displayText = useMemo(() => {
    if (selectedUsers.includes("all")) return "All Users";
    if (selectedUsers.length === 1) return getUserName(selectedUsers[0]);
    return `${selectedUsers.length} Users`;
  }, [selectedUsers, getUserName]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => toggleDropdown(dropdownKey)}
        className="flex items-center gap-2 bg-zinc-800 py-2 px-4 rounded-xl text-white text-sm border border-zinc-700 hover:bg-zinc-700 transition-colors"
      >
        <span>{displayText}</span>
        {isOpen ? <FaChevronUp className="text-gray-400 text-xs" /> : <FaChevronDown className="text-gray-400 text-xs" />}
      </button>

      {isOpen && (
        <div
          className={`absolute z-10 mt-2 ${position === "left" ? "right-0" : "left-0"} bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg w-64 max-h-80 overflow-y-auto`}
        >
          <div className="max-h-60 overflow-y-auto">
            <div
              className="flex items-center gap-2 px-4 py-2 hover:bg-zinc-700 cursor-pointer border-b border-zinc-700"
              onClick={() => onUserFilter("all")}
            >
              <input
                type="checkbox"
                checked={selectedUsers.includes("all")}
                readOnly
                className="h-4 w-4 accent-pink-500"
              />
              <span className="text-white">All Users</span>
            </div>

            {users.length > 0 && (
              <div className="px-4 py-1 bg-zinc-900 text-gray-400 text-xs font-semibold uppercase">
                Users
              </div>
            )}

            {users.map((user) => (
              <div
                key={user.id || user._id}
                className="flex items-center gap-2 px-4 py-2 hover:bg-zinc-700 cursor-pointer"
                onClick={() => onUserFilter(user.id || user._id)}
              >
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.id || user._id)}
                  readOnly
                  className="h-4 w-4 accent-pink-500"
                />
                <span className="text-white truncate">{user.full_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Main Component
export default function Dashboard() {
  // State Management
  const [platformData, setPlatformData] = useState([]);
  const [timeData, setTimeData] = useState([]);
  const [outputData, setOutputData] = useState([]);
  const [outputData2, setOutputData2] = useState([]);
  const [outputData3, setOutputData3] = useState([]);
  const [timeData2, setTimeData2] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [users, setUsers] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [search] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [dataLoader, setDataLoader] = useState({ type: null, flag: false });

  // Hooks
  const { user } = useAuthStore();
  const socketRef = useSocket(user);
  const { dropdowns, toggleDropdown, closeDropdown } = useDropdowns();
  const { dateTimeFilters, setDateTimeFilters, chartFilters, setChartFilters } = useFilters();

  // Permissions
  const permissions = user?.role?.permissions || [];
  const permissionKeys = permissions.map((p) => p.key);
  const userHasAdminPermission = hasPermission(
    permissionKeys,
    PERMISSIONS.TENANT_ADMIN_SUPER
  );

  // Pagination
  const totalPages = Math.ceil(tableData.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedData = tableData.slice(startIndex, startIndex + PAGE_SIZE);

  // Memoized values
  const getUserName = useCallback((userId) => {
    const tenant = tenants.find((t) => t.tenant === userId);
    if (tenant) return tenant.name;
    const user = users.find((u) => u.id === userId);
    return user?.full_name || "";
  }, [tenants, users]);

  // Generic filter handler
  const createUserFilterHandler = useCallback((filterKey) => (userId) => {
    setChartFilters(prev => {
      const currentFilter = prev[filterKey];
      let newUsers;

      if (userId === "all") {
        newUsers = ["all"];
      } else if (currentFilter.users.includes("all")) {
        newUsers = [userId];
      } else {
        newUsers = currentFilter.users.includes(userId)
          ? currentFilter.users.filter(id => id !== userId)
          : [...currentFilter.users, userId];
      }

      if (newUsers.length === 0) newUsers = ["all"];

      return {
        ...prev,
        [filterKey]: { ...currentFilter, users: newUsers }
      };
    });
  }, []);

  const createTypeFilterHandler = useCallback((filterKey) => (types) => {
    setChartFilters(prev => ({
      ...prev,
      [filterKey]: { ...prev[filterKey], type: types }
    }));
  }, []);

  // API Calls
  const createFetchFunction = useCallback((
    fetchFn,
    filterKey,
    setData,
    loaderType
  ) => async () => {
    setDataLoader({ type: loaderType, flag: true });
    try {
      const filter = chartFilters[filterKey];
      const usersFilter = filter.users.includes("all")
        ? "all"
        : filter.users.join(",");
      
      const params = {
        users: usersFilter,
        ...dateTimeFilters,
      };

      if (filter.type) {
        params.type = filter.type.includes("all")
          ? "all"
          : filter.type.join(",");
      }

      const data = await fetchFn(params);
      setData(data);
    } catch (error) {
      console.error(`Error fetching ${filterKey} data:`, error);
    } finally {
      setDataLoader({ type: loaderType, flag: false });
    }
  }, [chartFilters, dateTimeFilters]);

  // Initialize data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [usersData, tenantsData] = await Promise.all([
          fetchUsers(search),
          fetchTenants(search),
        ]);
        setUsers(usersData);
        setTenants(tenantsData);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };
    fetchInitialData();
  }, [search]);

  // Chart data fetchers
  const fetchPlatformData = createFetchFunction(
    fetchTimeOnPlatform,
    'platform',
    setPlatformData,
    'platformFilters'
  );

  const fetchTimeDataFn = createFetchFunction(
    fetchUsageTime,
    'time',
    setTimeData,
    'timeFilters'
  );

  const fetchOutputDataFn = createFetchFunction(
    fetchOutputStats,
    'output',
    setOutputData,
    'outputFilters'
  );

  const fetchOutputData2Fn = createFetchFunction(
    fetchOutputStats,
    'output2',
    setOutputData2,
    'outputFilters2'
  );

  const fetchOutputData3Fn = createFetchFunction(
    fetchOutputStats,
    'output3',
    setOutputData3,
    'outputFilters3'
  );

  const fetchTimeData2Fn = createFetchFunction(
    fetchOutputStats,
    'output4',
    setTimeData2,
    'outputFilters4'
  );

  const fetchCreditDataFn = createFetchFunction(
    fetchCreditConsumption,
    'credit',
    setOutputData2,
    'creditFilters'
  );

  const fetchActivityDataFn = createFetchFunction(
    fetchActivityLog,
    'activity',
    setTableData,
    'activityFilters'
  );

  // Data fetching effects
  useEffect(() => {
    fetchPlatformData();
  }, [chartFilters.platform, dateTimeFilters]);

  useEffect(() => {
    fetchTimeDataFn();
  }, [chartFilters.time, dateTimeFilters]);

  useEffect(() => {
    fetchOutputDataFn();
  }, [chartFilters.output, dateTimeFilters]);

  useEffect(() => {
    fetchOutputData2Fn();
  }, [chartFilters.output2, dateTimeFilters]);

  useEffect(() => {
    fetchOutputData3Fn();
  }, [chartFilters.output3, dateTimeFilters]);

  useEffect(() => {
    fetchTimeData2Fn();
  }, [chartFilters.output4, dateTimeFilters]);

  useEffect(() => {
    fetchCreditDataFn();
  }, [chartFilters.credit, dateTimeFilters]);

  useEffect(() => {
    fetchActivityDataFn();
  }, [chartFilters.activity, dateTimeFilters]);

  // Pagination handlers
  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Transform data
  const outputDataTransformed = transformChartData(outputData);
  const outputData2Transformed = transformChartData(outputData2);
  const outputData3Transformed = transformChartData(outputData3);
  const timeDataTransformed = transformTimeData(timeData);

  return (
    <div className="text-white flex flex-col p-6">
      {/* Dashboard Header */}
      <div className="flex flex-wrap justify-between lg:items-center gap-4 mb-4 lg:mb-6">
        <h2 className="text-2xl font-semibold">Overview</h2>
        <div className="flex flex-wrap items-center gap-4">
          <DateRangeFilter
            startDate={dateTimeFilters.startDate}
            endDate={dateTimeFilters.endDate}
            onStartDateChange={(date) => setDateTimeFilters(prev => ({ ...prev, startDate: date }))}
            onEndDateChange={(date) => setDateTimeFilters(prev => ({ ...prev, endDate: date }))}
          />
          <TimeRangeFilter
            startTime={dateTimeFilters.startTime}
            endTime={dateTimeFilters.endTime}
            onStartTimeChange={(time) => setDateTimeFilters(prev => ({ ...prev, startTime: time }))}
            onEndTimeChange={(time) => setDateTimeFilters(prev => ({ ...prev, endTime: time }))}
          />
        </div>
      </div>

      {/* Dashboard Charts */}
      <div className="grid lg:grid-cols-4 gap-4 pt-5">
        {/* Platform Bar Chart */}
        <div className="lg:col-span-2 flex flex-col">
          <PlatformBarChartCard
            platformData={platformData}
            dataLoader={dataLoader}
            userHasAdminPermission={userHasAdminPermission}
            PlatformUserFilterDropdown={() => (
              <UserFilterDropdown
                users={users}
                selectedUsers={chartFilters.platform.users}
                onUserFilter={createUserFilterHandler('platform')}
                dropdownKey="platformUsers"
                isOpen={dropdowns.platformUsers}
                toggleDropdown={toggleDropdown}
                closeDropdown={closeDropdown}
                getUserName={getUserName}
              />
            )}
          />
        </div>

        {/* Total Time Chart */}
        <div className="p-5 relative rounded-xl shadow-sm border-shadow-blur flex flex-col justify-end lg:h-full">
          <h2 className="text-lg absolute top-1/2 left-0 -translate-x-4 -translate-y-1/2 -rotate-90 origin-center h-6">
            Total Time
          </h2>
          <div className="flex h-full items-end">
            <PlatformTotalBarChart
              data={getTotalData(platformData)}
              formatMinutes={formatMinutes}
            />
          </div>
        </div>

        {/* Usage Time Chart */}
        <div className="lg:col-span-2 flex flex-col usage-time">
          <GroupedBarChart
            data={timeDataTransformed}
            chartConfig={CHART_CONFIG}
            dataKeyOne="time"
            heading="Usage Time"
            leftDropdown={
              <TypeFilterDropdown
                currentFilter={chartFilters.time.type}
                onFilterChange={createTypeFilterHandler('time')}
                dropdownKey="timeType"
                isOpen={dropdowns.timeType}
                toggleDropdown={toggleDropdown}
                closeDropdown={closeDropdown}
              />
            }
            rightDropdown={
              <UserFilterDropdown
                users={users}
                selectedUsers={chartFilters.time.users}
                onUserFilter={createUserFilterHandler('time')}
                dropdownKey="timeUsers"
                isOpen={dropdowns.timeUsers}
                toggleDropdown={toggleDropdown}
                closeDropdown={closeDropdown}
                getUserName={getUserName}
              />
            }
            originalData={timeData}
            userHasAdminPermission={userHasAdminPermission}
            dataLoader={dataLoader.type === "timeFilters" ? dataLoader.flag : null}
            formatter={(value) => [formatMinutes(value)]}
            zIndex={20}
          />
        </div>

        {/* Additional Output Charts */}
        <div className="lg:col-span-2 p-4 w-full relative z-10 rounded-xl border-shadow-blur output-chart">
          <div className="flex justify-between">
            <TypeFilterDropdown
              currentFilter={chartFilters.output4.type}
              onFilterChange={createTypeFilterHandler('output4')}
              dropdownKey="outputType4"
              isOpen={dropdowns.outputType4}
              toggleDropdown={toggleDropdown}
              closeDropdown={closeDropdown}
            />
            {userHasAdminPermission && (
              <UserFilterDropdown
                users={users}
                selectedUsers={chartFilters.output4.users}
                onUserFilter={createUserFilterHandler('output4')}
                dropdownKey="outputUsers4"
                isOpen={dropdowns.outputUsers4}
                toggleDropdown={toggleDropdown}
                closeDropdown={closeDropdown}
                getUserName={getUserName}
              />
            )}
          </div>
          <h2 className="text-lg absolute top-1/2 -left-10 -translate-y-1/2 -rotate-90">NO. Of Outputs</h2>
          <div className="flex h-full items-end">
            <ResponsiveContainer width="100%" height={200} barCategoryGap="10%">
              <BarChart data={timeData2}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#FFFFFF", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.25)" }}
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    color: "#000000",
                    fontSize: "12px",
                    border: "none",
                    borderRadius: "4px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    padding: "8px",
                  }}
                />
                {['value1', 'value2', 'value3'].map((value, idx) => (
                  <Bar key={value} dataKey={value} radius={[4, 4, 0, 0]}>
                    {timeData2.map((entry, index) => (
                      <Cell
                        key={`cell-${value}-${index}`}
                        fill={idx === 0 ? "#FFFFFF" : idx === 1 ? "#CCCCCC" : "#999999"}
                      />
                    ))}
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Output Charts */}
        <div className="lg:col-span-2 flex flex-col">
          <GroupedBarChart
            data={outputDataTransformed}
            chartConfig={CHART_CONFIG}
            heading="No. of Outputs"
            leftDropdown={
              <TypeFilterDropdown
                currentFilter={chartFilters.output2.type}
                onFilterChange={createTypeFilterHandler('output2')}
                dropdownKey="outputType2"
                isOpen={dropdowns.outputType2}
                toggleDropdown={toggleDropdown}
                closeDropdown={closeDropdown}
              />
            }
            rightDropdown={
              <UserFilterDropdown
                users={users}
                selectedUsers={chartFilters.output2.users}
                onUserFilter={createUserFilterHandler('output2')}
                dropdownKey="outputUsers2"
                isOpen={dropdowns.outputUsers2}
                toggleDropdown={toggleDropdown}
                closeDropdown={closeDropdown}
                getUserName={getUserName}
              />
            }
            originalData={outputData}
            dataLoader={dataLoader.type === "outputFilters" ? dataLoader.flag : null}
            userHasAdminPermission={userHasAdminPermission}
            zIndex={10}
          />
        </div>

        <OutputSummaryBarChart outputData={outputData} />

        <div className="lg:col-span-2 flex flex-col">
          <GroupedBarChart
            data={outputData3Transformed}
            chartConfig={CHART_CONFIG}
            heading="No. of Outputs"
            leftDropdown={
              <TypeFilterDropdown
                currentFilter={chartFilters.output3.type}
                onFilterChange={createTypeFilterHandler('output3')}
                dropdownKey="outputType3"
                isOpen={dropdowns.outputType3}
                toggleDropdown={toggleDropdown}
                closeDropdown={closeDropdown}
              />
            }
            rightDropdown={
              <UserFilterDropdown
                users={users}
                selectedUsers={chartFilters.output3.users}
                onUserFilter={createUserFilterHandler('output3')}
                dropdownKey="outputUsers3"
                isOpen={dropdowns.outputUsers3}
                toggleDropdown={toggleDropdown}
                closeDropdown={closeDropdown}
                getUserName={getUserName}
              />
            }
            originalData={outputData3}
            dataLoader={dataLoader.type === "outputFilters2" ? dataLoader.flag : null}
            userHasAdminPermission={userHasAdminPermission}
            zIndex={20}
          />
        </div>

        {/* Credit Consumed Chart */}
        <div className="lg:col-span-2 flex flex-col">
          <GroupedBarChart
            data={outputData2Transformed}
            chartConfig={CHART_CONFIG}
            heading="Credit Consumed"
            leftDropdown={
              <TypeFilterDropdown
                currentFilter={chartFilters.credit.type}
                onFilterChange={createTypeFilterHandler('credit')}
                dropdownKey="creditType"
                isOpen={dropdowns.creditType}
                toggleDropdown={toggleDropdown}
                closeDropdown={closeDropdown}
              />
            }
            rightDropdown={
              <UserFilterDropdown
                users={users}
                selectedUsers={chartFilters.credit.users}
                onUserFilter={createUserFilterHandler('credit')}
                dropdownKey="creditUsers"
                isOpen={dropdowns.creditUsers}
                toggleDropdown={toggleDropdown}
                closeDropdown={closeDropdown}
                getUserName={getUserName}
              />
            }
            originalData={outputData2}
            dataLoader={dataLoader.type === "creditFilters" ? dataLoader.flag : null}
            userHasAdminPermission={userHasAdminPermission}
            zIndex={10}
          />
        </div>

        {/* Activity Log Table */}
        <div className="lg:col-span-full w-full max-w-full bg-black p-6 rounded-xl shadow-sm border-shadow-blur">
          <h2 className="text-lg font-semibold mb-4">Activity Log</h2>
          <div className="max-w-[calc(100vw_-_128px)] lg:max-w-full">
            <ActivityLogTable paginatedData={paginatedData} />
          </div>
          <div className="flex items-center justify-between mt-4 max-w-full">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded ${
                currentPage === 1
                  ? "bg-white/35 cursor-not-allowed"
                  : "bg-purple-500 hover:bg-purple-600"
              } text-white`}
            >
              Previous
            </button>
            <span className="text-sm text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded ${
                currentPage === totalPages
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-purple-500 hover:bg-purple-600"
              } text-white`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}