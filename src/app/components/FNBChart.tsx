'use client'
import { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import { supabase } from '@/app/lib/supabaseClient';
import Spinner from '@/app/components/Spinner';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  Title
);

interface FNBChartProps {
    startDate: string,
    endDate: string
}

interface FNBSalesByType {
    type: string;
    totalSales: number;
}

export default function FNBChart({startDate, endDate} : FNBChartProps){
    const [salesData, setSalesData] = useState<FNBSalesByType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFNBSales = async () => {
            if (!startDate || !endDate) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // First, get all orders within the date range
                const { data: ordersData, error: ordersError } = await supabase
                    .from('order')
                    .select('order_id')
                    .gte('order_date', startDate)
                    .lte('order_date', endDate);

                if (ordersError) {
                    console.error('Error fetching orders:', ordersError);
                    setLoading(false);
                    return;
                }

                if (!ordersData || ordersData.length === 0) {
                    setSalesData([]);
                    setLoading(false);
                    return;
                }

                // Get all order IDs
                const orderIds = ordersData.map(o => o.order_id);

                // Fetch order_list items with FNB type information
                const { data: orderListData, error: orderListError } = await supabase
                    .from('order_list')
                    .select('price, fnb(type)')
                    .in('order_id', orderIds);

                if (orderListError) {
                    console.error('Error fetching order list:', orderListError);
                    setLoading(false);
                    return;
                }

                // Group sales by type
                const salesByType: { [key: string]: number } = {};
                
                orderListData?.forEach((item: any) => {
                    const type = item.fnb?.type || 'Unknown';
                    const price = item.price || 0;
                    salesByType[type] = (salesByType[type] || 0) + price;
                });

                // Convert to array
                const salesArray: FNBSalesByType[] = Object.entries(salesByType)
                    .map(([type, totalSales]) => ({
                        type,
                        totalSales: totalSales as number
                    }))
                    .sort((a, b) => a.type.localeCompare(b.type));

                setSalesData(salesArray);
            } catch (error) {
                console.error('Error processing FNB sales:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFNBSales();
    }, [startDate, endDate]);

    // Define colors for each type
    const getColorForType = (type: string, index: number) => {
        const colors = [
            'rgba(54, 162, 235, 0.8)',  // Blue for Food
            'rgba(255, 99, 132, 0.8)',  // Red for Beverages
            'rgba(255, 206, 86, 0.8)',  // Yellow for Combo
            'rgba(75, 192, 192, 0.8)',  // Teal
            'rgba(153, 102, 255, 0.8)', // Purple
        ];
        return colors[index % colors.length];
    };

    const chartData = {
        labels: salesData.map(item => item.type),
        datasets: [
            {
                label: 'Sales (RM)',
                data: salesData.map(item => item.totalSales),
                backgroundColor: salesData.map((item, index) => getColorForType(item.type, index)),
                borderColor: salesData.map((item, index) => getColorForType(item.type, index).replace('0.8', '1')),
                borderWidth: 2,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right' as const,
            },
            title: {
                display: true,
                text: `FNB Sales by Type from ${startDate} to ${endDate}`,
                font: {
                    size: 16,
                },
            },
            tooltip: {
                callbacks: {
                    label: function(context: any) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${label}: RM ${value.toFixed(2)} (${percentage}%)`;
                    }
                }
            }
        },
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-86 max-w-108">
                <Spinner />
            </div>
        );
    }

    if (!startDate || !endDate) {
        return (
            <div className="flex items-center justify-center h-86 max-w-108">
                <p>Please select a date range to view FNB sales</p>
            </div>
        );
    }

    if (salesData.length === 0) {
        return (
            <div className="flex items-center justify-center h-86 max-w-108">
                <p>No FNB sales data found for the selected date range</p>
            </div>
        );
    }

    return (
        <div className="p-4 flex h-86 max-w-108">
            <Pie data={chartData} options={chartOptions} className='mb-4'/>
        </div>
    );
}