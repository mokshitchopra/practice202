import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { getCroppedImg } from "@/lib/utils";

interface ImageCropperProps {
    imageSrc: string | null;
    onCropComplete: (croppedImage: Blob) => void;
    onCancel: () => void;
    open: boolean;
}

export default function ImageCropper({ imageSrc, onCropComplete, onCancel, open }: ImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropCompleteHandler = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        if (imageSrc && croppedAreaPixels) {
            try {
                const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
                if (croppedImage) {
                    onCropComplete(croppedImage);
                }
            } catch (e) {
                console.error(e);
            }
        }
    };

    console.log("ImageCropper rendering. Open:", open, "ImageSrc:", !!imageSrc);
    return (
        <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="sm:max-w-[600px] z-[100]">
                <DialogHeader>
                    <DialogTitle>Crop Image</DialogTitle>
                </DialogHeader>
                <div className="relative h-[400px] w-full bg-black/5 rounded-md overflow-hidden">
                    {imageSrc && (
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={4 / 3}
                            onCropChange={onCropChange}
                            onCropComplete={onCropCompleteHandler}
                            onZoomChange={onZoomChange}
                        />
                    )}
                </div>
                <div className="py-4">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium w-12">Zoom</span>
                        <Slider
                            value={[zoom]}
                            min={1}
                            max={3}
                            step={0.1}
                            onValueChange={(value) => setZoom(value[0])}
                            className="flex-1"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>Save Crop</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
