'use client';
import { Theme, Button, Spinner } from '@radix-ui/themes';
import { ArrowLeftIcon, PlusIcon } from "@radix-ui/react-icons";
import Form from 'next/form';
import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabaseClient';
import Link from 'next/link';

export default function AddFnbItemPage(){
    const [itemName, setItemName] = useState('');
    const [itemDesc, setItemDesc] = useState('');
    const [itemPrice, setItemPrice] = useState('');
    const [itemType, setItemType] = useState('Food');
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false)

    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const router = useRouter();

    // Clean up preview URL when component unmounts or image changes
    useEffect(() => {
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setImage(file);
            
            // Create preview URL
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
        }
    };

    const uploadImage = async (file: File): Promise<string | null> => {
        const filePath = `${file.name}`

        const {error} = await supabase.storage.from("fnb_image").upload(filePath, file);

        if (error) {
            console.error("Error uploading image:", error.message);
            return null;
        }

        const {data} = await supabase.storage.from("fnb_image").getPublicUrl(filePath);

        return data.publicUrl
    }
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        let imageUrl: string | null = null;
        if (image) {
            imageUrl = await uploadImage(image)
        }

        const newErrors: { [key: string]: string} = {};

        if (!itemName) newErrors.itemName = "*Required field"
        if (!itemDesc) newErrors.itemDesc = "*Required field"
        if (!itemPrice) newErrors.itemPrice = "*Required field"
        if (!itemType) newErrors.itemType= "*Required field"
        if (!image) newErrors.image = "*Image required";

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            setLoading(false);
            return;
        }

        const {error} = await supabase
            .from("fnb")
            .insert([
                {
                    fnb_name: itemName,
                    fnb_desc: itemDesc,
                    type: itemType,
                    price: parseFloat(itemPrice),
                    image_url: imageUrl
                }
            ]);

        if (error) {
            console.error("Error adding F&B item:", error);
            setErrors({ general: "*Error adding F&B item. Please try again." });
            setLoading(false)
        } else {
            router.push('/manager/fnb?success=1');
        }
    }

    const getInputClass = (field: string) =>
        `border p-2 rounded-md focus:ring-2 focus:ring-blue-400 outline-none transition ${
            errors[field] ? 'border-red-500 focus:ring-2 focus:ring-red-400' : 'border-gray-300 focus:ring-2 focus:ring-blue-400'
        }`;

    return(
        <div className="font-inter py-10 px-12">
            <h1 className='text-2xl font-bold font-inter mb-4'>Add F&B Item</h1>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <Link href="/manager/fnb" className="text-black hover:underline mb-4 flex gap-1 items-center">
                    <ArrowLeftIcon />
                    Back
                </Link>

                <hr className="my-2 text-gray-300" />

                <Theme className='inline'>
                    {errors.general && (
                        <p className="text-red-500 font-inter mb-2">{errors.general}</p>
                    )}
                    <Form action="/manager/fnb" className="grid grid-cols-2 space-y-4 gap-4 mt-6 font-inter" onSubmit={handleSubmit}>
                        <div className='flex flex-col gap-1'>
                            <label>F&B Item Name<span className="text-red-500">*</span></label>
                            <input type="text" placeholder='F&B Item Name' className={getInputClass("itemName")} value={itemName} onChange={(e) => setItemName(e.target.value)}></input>
                            {errors.itemName && <p className="text-red-500 text-sm">{errors.itemName}</p>}
                        </div>

                        <div className='flex flex-col gap-1'>
                            <label>F&B Item Description<span className="text-red-500">*</span></label>
                            <textarea placeholder='F&B Item Description' className={getInputClass("itemDesc")} value={itemDesc} onChange={(e) => setItemDesc(e.target.value)}></textarea>
                            {errors.itemDesc && <p className="text-red-500 text-sm">{errors.itemDesc}</p>}
                        </div>

                        <div className='flex flex-col gap-1'>
                            <label>F&B Item Price<span className="text-red-500">*</span></label>
                            <input type="number" placeholder='0.00' step={0.01} className={getInputClass("itemPrice")} value={itemPrice} onChange={(e) => setItemPrice(e.target.value)}></input>
                            {errors.itemPrice && <p className="text-red-500 text-sm">{errors.itemPrice}</p>}
                        </div>

                        <div className='flex flex-col gap-1'>
                            <label>Type<span className="text-red-500">*</span></label>
                            <select className={getInputClass("itemType")} value={itemType} onChange={(e) => setItemType(e.target.value)}>
                                <option value="Food">Food</option>
                                <option value="Beverages">Beverages</option>
                                <option value="Combo">Combo</option>
                            </select>
                            {errors.itemType && <p className="text-red-500 text-sm">{errors.itemType}</p>}
                        </div>

                        <div className="flex flex-col gap-1">
                            <label>Image<span className="text-red-500">*</span></label>
                            <input 
                                type="file"
                                accept='image/*'
                                onChange={handleFileChange}
                                className={`${getInputClass("image")} file:cursor-pointer file:bg-gray-300 file:text-gray-800 file:text-base hover:file:bg-gray-200 file:rounded-sm file:px-2 file:mr-3`}
                            />
                            {errors.image && <p className="text-red-500 text-sm">{errors.image}</p>}
                            {imagePreview && (
                                <div className="mt-2">
                                    <img 
                                        src={imagePreview} 
                                        alt="Preview" 
                                        className="max-w-xs max-h-64 rounded-md border border-gray-300 object-contain"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex items-end justify-self-end">
                            <Button color="green" size="2" variant="solid" type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Spinner />
                                        Adding...
                                    </>
                                ) : (
                                    <>
                                        <PlusIcon />
                                        Add F&B Item
                                    </>
                                )}
                                
                            </Button>
                        </div>
                    </Form>
                </Theme>
            </div>
        </div>
    )
}