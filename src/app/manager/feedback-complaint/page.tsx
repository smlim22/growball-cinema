'use client'
import { Theme, Button, Dialog, Flex, TextArea, Spinner as Sp } from '@radix-ui/themes';
import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { ChevronLeftIcon, ChevronRightIcon, ChatBubbleIcon } from "@radix-ui/react-icons";
import Spinner from '@/app/components/Spinner';

type Feedback = {
    feedback_id: number,
    ticket_id: number,
    rating: number,
    desc: string,
    date: string,
    ticket: {
        ticket_id: number,
        customer: {cust_name: string | null} | null
    } | null;
};

type Complaint = {
    complaint_id: number,
    title: string,
    complaint_type: string,
    desc: string,
    date: string,
    customer: {cust_name: string | null} | null,
    reply: string,
    status: string,
}

export default function FeedbackComplaintPage(){
    const [activeTab, setActiveTab] = useState<"feedback" | "complaint">("feedback");
    const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
    const [complaintList, setComplaintList] = useState<Complaint[]>([]);
    const [sortOrder, setSortOrder] = useState('Newest');
    const [ratingsOrder, setRatingsOrder] = useState('HL');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 10;
    
    // Loading states
    const [isFeedbackLoading, setIsFeedbackLoading] = useState(true);
    const [isComplaintLoading, setIsComplaintLoading] = useState(true);
    
    // Complaint-specific states
    const [complaintSortOrder, setComplaintSortOrder] = useState('Newest');
    const [statusFilter, setStatusFilter] = useState('All');
    const [complaintCurrentPage, setComplaintCurrentPage] = useState<number>(1);
    const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-GB"); // 25/10/2025
    };

    // Pagination calculations for Feedback
    const totalPages = Math.ceil(feedbackList.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedFeedback = feedbackList.slice(startIndex, endIndex);

    // Pagination calculations for Complaint
    const complaintTotalPages = Math.ceil(complaintList.length / itemsPerPage);
    const complaintStartIndex = (complaintCurrentPage - 1) * itemsPerPage;
    const complaintEndIndex = complaintStartIndex + itemsPerPage;
    const paginatedComplaint = complaintList.slice(complaintStartIndex, complaintEndIndex);

    // Generate page numbers to display
    const getPageNumbers = (total: number, current: number) => {
        const pages: (number | string)[] = [];
        const maxVisiblePages = 5;
        
        if (total <= maxVisiblePages) {
            // Show all pages if total is less than max visible
            for (let i = 1; i <= total; i++) {
                pages.push(i);
            }
        } else {
            // Show first page
            pages.push(1);
            
            if (current > 3) {
                pages.push('...');
            }
            
            // Show pages around current page
            const start = Math.max(2, current - 1);
            const end = Math.min(total - 1, current + 1);
            
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
            
            if (current < total - 2) {
                pages.push('...');
            }
            
            // Show last page
            pages.push(total);
        }
        
        return pages;
    };

    useEffect(() => {
        const fetchFeedback = async () => {
            setIsFeedbackLoading(true);
            let query = supabase.from("feedback").select("*, ticket(ticket_id, customer(cust_name))");

            if (sortOrder == "Newest"){
                query = query.order("date", { ascending: false});
            } else {
                query = query.order("date", { ascending: true});
            }

            if (ratingsOrder == "HL"){
                query = query.order("rating", { ascending: false});
            } else{
                query = query.order("rating", { ascending: true});
            }

            const { data, error } = await query;

            if(error){
                console.error("Error fetching feedback", error)
            } else {
                setFeedbackList(data ?? []);
                setCurrentPage(1); // Reset to first page when sorting changes
            }
            setIsFeedbackLoading(false);
        };

        fetchFeedback();
    }, [sortOrder, ratingsOrder]);

    useEffect(() => {
        const fetchComplaints = async () => {
            setIsComplaintLoading(true);
            let query = supabase.from("complaint").select("*, customer(cust_name)");

            // Filter by status
            if (statusFilter !== "All") {
                query = query.eq("status", statusFilter);
            }

            // Sort by date
            if (complaintSortOrder == "Newest"){
                query = query.order("date", { ascending: false});
            } else {
                query = query.order("date", { ascending: true});
            }

            const { data, error } = await query;

            if(error){
                console.error("Error fetching complaints", error)
            } else {
                setComplaintList(data ?? []);
                setComplaintCurrentPage(1); // Reset to first page when sorting changes
            }
            setIsComplaintLoading(false);
        };

        fetchComplaints();
    }, [complaintSortOrder, statusFilter]);

    const handleReplySubmit = async () => {
        if (!selectedComplaint || !replyText.trim()) return;

        setIsSubmittingReply(true);

        const { error } = await supabase
            .from("complaint")
            .update({ 
                reply: replyText, 
                status: "Resolved" 
            })
            .eq("complaint_id", selectedComplaint.complaint_id);

        if (error) {
            console.error("Error updating complaint:", error);
            setIsSubmittingReply(false);
        } else {
            // Refresh complaints
            const fetchComplaints = async () => {
                let query = supabase.from("complaint").select("*, customer(cust_name)");
                if (statusFilter !== "All") {
                    query = query.eq("status", statusFilter);
                }
                if (complaintSortOrder == "Newest"){
                    query = query.order("date", { ascending: false});
                } else {
                    query = query.order("date", { ascending: true});
                }
                const { data } = await query;
                setComplaintList(data ?? []);
            };
            await fetchComplaints();
            
            setIsSubmittingReply(false);
            setIsReplyDialogOpen(false);
            setReplyText('');
            setSelectedComplaint(null);
        }
    };

    const openReplyDialog = (complaint: Complaint) => {
        setSelectedComplaint(complaint);
        setReplyText(complaint.reply || '');
        setIsReplyDialogOpen(true);
    };

    return (
        <div className="py-10 px-12">
            <Theme className='inline'>
                <h1 className="text-2xl font-bold font-inter">Feedback & Complaint Management</h1>
                <div className='flex flex-col p-4 my-4 font-inter gap-4'>
                    <div className='flex gap-2'>
                        <button 
                            onClick={() => setActiveTab("feedback")}
                            // className='bg-gray-200 font-semibold rounded-md p-2 hover:bg-signature-red hover:text-white'
                            className={`font-semibold rounded-md p-2 ${ 
                                activeTab === "feedback" ? "bg-signature-red text-white" : "bg-gray-200 hover:bg-signature-red hover:text-white" 
                            }`}
                        >
                            Feedback
                        </button>
                        <button
                            onClick={() => setActiveTab("complaint")}
                            className={`font-semibold rounded-md p-2 ${ 
                                activeTab === "complaint" ? "bg-signature-red text-white" : "bg-gray-200 hover:bg-signature-red hover:text-white" 
                            }`}
                        >
                            Complaint
                        </button>
                    </div>
                    {activeTab === "feedback" && (
                        <>
                        {isFeedbackLoading ? (
                            <Spinner />
                        ) : (
                        <>
                        <div className="flex flex-wrap items-center bg-white shadow-sm rounded-lg p-4 gap-4">
                            <div className="flex flex-row items-center gap-x-1">
                                <label>Sort By:</label>
                                <select
                                    className="border border-gray-300 p-2 rounded-md"
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value)}
                                >
                                    <option value="Newest">Newest</option>
                                    <option value="Oldest">Oldest</option>
                                </select>
                            </div>
                            <div className="flex flex-row items-center gap-x-1">
                                <label>Ratings:</label>
                                <select
                                    className="border border-gray-300 p-2 rounded-md"
                                    value={ratingsOrder}
                                    onChange={(e) => setRatingsOrder(e.target.value)}
                                >
                                    <option value="HL">High to Low</option>
                                    <option value="LH">Low to High</option>
                                </select>
                            </div>
                        </div>
                        <table className='border border-collapse rounded-lg overflow-hidden bg-white shadow-md'>
                            <thead className="bg-signature-red text-white">
                                <tr>
                                    <th className="border border-signature-red py-3 px-6 text-left">No</th>
                                    <th className="border border-signature-red py-3 px-6 text-left">Name</th>
                                    <th className="border border-signature-red py-3 px-6 text-center">Ticket ID</th>
                                    <th className="border border-signature-red py-3 px-6 text-center">Rating</th>
                                    <th className="border border-signature-red py-3 px-6 text-left">Feedback</th>
                                    <th className="border border-signature-red py-3 px-6 text-left">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedFeedback.length > 0 ? (
                                    paginatedFeedback.map((feedback, index) => (
                                        <tr key={feedback.feedback_id} className='border-t border-gray-200 hover:bg-gray-50'>
                                            <td className="py-3 px-6">{startIndex + index + 1}</td>
                                            <td className="py-3 px-6">{feedback.ticket?.customer?.cust_name}</td>
                                            <td className="py-3 px-6 text-center">{feedback.ticket_id}</td>
                                            <td className="py-3 px-6 text-center">{feedback.rating}/5</td>
                                            <td className="py-3 px-6">{feedback.desc == null ? "N/A" : feedback.desc}</td>
                                            <td className="py-3 px-6">{formatDate(feedback.date)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td className="py-3 px-6 text-center" colSpan={6}>
                                            No feedback are available.
                                        </td>
                                    </tr>
                                )}
                                
                            </tbody>
                        </table>

                        {/* Pagination Controls */}
                        {feedbackList.length > 0 && (
                            <div className="flex items-center justify-between mt-4 font-inter">
                                <div className="text-sm text-gray-600">
                                    Showing {startIndex + 1} to {Math.min(endIndex, feedbackList.length)} of {feedbackList.length} feedback
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        color="gray"
                                        variant="soft"
                                        size="2"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeftIcon />
                                        Previous
                                    </Button>
                                    
                                    <div className="flex items-center gap-1">
                                        {getPageNumbers(totalPages, currentPage).map((page, index) => (
                                            page === '...' ? (
                                                <span key={`ellipsis-${index}`} className="px-2 text-gray-500">...</span>
                                            ) : (
                                                <Button
                                                    key={page}
                                                    color={currentPage === page ? "blue" : "gray"}
                                                    variant={currentPage === page ? "solid" : "soft"}
                                                    size="2"
                                                    onClick={() => setCurrentPage(page as number)}
                                                >
                                                    {page}
                                                </Button>
                                            )
                                        ))}
                                    </div>
                                    
                                    <Button
                                        color="gray"
                                        variant="soft"
                                        size="2"
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                        <ChevronRightIcon />
                                    </Button>
                                </div>
                            </div>
                        )}
                        </>
                        )}
                        </>
                    )}

                    {activeTab === "complaint" && (
                        <>
                        {isComplaintLoading ? (
                            <Spinner />
                        ) : (
                        <>
                        <div className="flex flex-wrap items-center bg-white shadow-sm rounded-lg p-4 gap-4">
                            <div className="flex flex-row items-center gap-x-1">
                                <label>Sort By:</label>
                                <select
                                    className="border border-gray-300 p-2 rounded-md"
                                    value={complaintSortOrder}
                                    onChange={(e) => setComplaintSortOrder(e.target.value)}
                                >
                                    <option value="Newest">Newest</option>
                                    <option value="Oldest">Oldest</option>
                                </select>
                            </div>
                            <div className="flex flex-row items-center gap-x-1">
                                <label>Status:</label>
                                <select
                                    className="border border-gray-300 p-2 rounded-md"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="All">All</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Resolved">Resolved</option>
                                </select>
                            </div>
                        </div>
                        <table className='border border-collapse rounded-lg overflow-hidden bg-white shadow-md'>
                            <thead className="bg-signature-red text-white">
                                <tr>
                                    <th className="border border-signature-red py-3 px-6 text-left">No</th>
                                    <th className="border border-signature-red py-3 px-6 text-left">Name</th>
                                    <th className="border border-signature-red py-3 px-6 text-left">Title</th>
                                    <th className="border border-signature-red py-3 px-6 text-left">Type</th>
                                    <th className="border border-signature-red py-3 px-6 text-left">Description</th>
                                    <th className="border border-signature-red py-3 px-6 text-center">Status</th>
                                    <th className="border border-signature-red py-3 px-6 text-left">Date</th>
                                    <th className="border border-signature-red py-3 px-6 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedComplaint.length > 0 ? (
                                    paginatedComplaint.map((complaint, index) => (
                                        <tr key={complaint.complaint_id} className='border-t border-gray-200 hover:bg-gray-50'>
                                            <td className="py-3 px-6">{complaintStartIndex + index + 1}</td>
                                            <td className="py-3 px-6">{complaint.customer?.cust_name}</td>
                                            <td className="py-3 px-6">{complaint.title}</td>
                                            <td className="py-3 px-6">{complaint.complaint_type}</td>
                                            <td className="py-3 px-6">{complaint.desc == null ? "N/A" : complaint.desc}</td>
                                            <td className="py-3 px-6 text-center">
                                                <span className={`px-2 py-1 rounded-full text-sm font-semibold ${
                                                    complaint.status === "Resolved" 
                                                        ? "bg-green-100 text-green-800" 
                                                        : "bg-yellow-100 text-yellow-800"
                                                }`}>
                                                    {complaint.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-6">{formatDate(complaint.date)}</td>
                                            <td className="py-3 px-6 text-center">
                                                <Button
                                                    color="green"
                                                    size="2"
                                                    variant="solid"
                                                    onClick={() => openReplyDialog(complaint)}
                                                >
                                                    <ChatBubbleIcon />
                                                    Reply
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td className="py-3 px-6 text-center" colSpan={8}>
                                            No complaints are available.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Pagination Controls */}
                        {complaintList.length > 0 && (
                            <div className="flex items-center justify-between mt-4 font-inter">
                                <div className="text-sm text-gray-600">
                                    Showing {complaintStartIndex + 1} to {Math.min(complaintEndIndex, complaintList.length)} of {complaintList.length} complaints
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        color="gray"
                                        variant="soft"
                                        size="2"
                                        onClick={() => setComplaintCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={complaintCurrentPage === 1}
                                    >
                                        <ChevronLeftIcon />
                                        Previous
                                    </Button>
                                    
                                    <div className="flex items-center gap-1">
                                        {getPageNumbers(complaintTotalPages, complaintCurrentPage).map((page, index) => (
                                            page === '...' ? (
                                                <span key={`ellipsis-${index}`} className="px-2 text-gray-500">...</span>
                                            ) : (
                                                <Button
                                                    key={page}
                                                    color={complaintCurrentPage === page ? "blue" : "gray"}
                                                    variant={complaintCurrentPage === page ? "solid" : "soft"}
                                                    size="2"
                                                    onClick={() => setComplaintCurrentPage(page as number)}
                                                >
                                                    {page}
                                                </Button>
                                            )
                                        ))}
                                    </div>
                                    
                                    <Button
                                        color="gray"
                                        variant="soft"
                                        size="2"
                                        onClick={() => setComplaintCurrentPage(prev => Math.min(complaintTotalPages, prev + 1))}
                                        disabled={complaintCurrentPage === complaintTotalPages}
                                    >
                                        Next
                                        <ChevronRightIcon />
                                    </Button>
                                </div>
                            </div>
                        )}
                        </>
                        )}
                        </>
                    )}
                </div>

                {/* Reply Dialog */}
                <Dialog.Root open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
                    <Dialog.Content style={{ maxWidth: 500 }}>
                        <Dialog.Title className='font-inter'>Reply to Complaint</Dialog.Title>
                        <Dialog.Description size="2" mb="4">
                            <div className="space-y-2 text-sm font-inter">
                                <p><strong>Customer:</strong> {selectedComplaint?.customer?.cust_name}</p>
                                <p><strong>Title:</strong> {selectedComplaint?.title}</p>
                                <p><strong>Description:</strong> {selectedComplaint?.desc}</p>
                                <p><strong>Type:</strong> {selectedComplaint?.complaint_type}</p>
                                <p><strong>Status:</strong> {selectedComplaint?.status}</p>
                            </div>
                        </Dialog.Description>

                        <Flex direction="column" gap="3">
                            <label>
                                <strong className='font-inter'>Your Reply:</strong>
                                <TextArea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Enter your reply here..."
                                    style={{ marginTop: '8px' }}
                                    rows={5}
                                />
                            </label>
                        </Flex>

                        <Flex gap="3" mt="4" justify="end">
                            <Button
                                variant="soft" 
                                color="gray" 
                                onClick={() => {
                                    setIsReplyDialogOpen(false);
                                    setReplyText('');
                                    setSelectedComplaint(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button 
                                variant="solid" 
                                color="green"
                                onClick={handleReplySubmit}
                                disabled={!replyText.trim() || isSubmittingReply}
                            >
                                {isSubmittingReply ? (
                                    <>
                                        <Sp />
                                        Submitting...
                                    </>
                                ) : (
                                    "Submit Reply"
                                )}
                            </Button>
                        </Flex>
                    </Dialog.Content>
                </Dialog.Root>
            </Theme>
        </div>
    )
}