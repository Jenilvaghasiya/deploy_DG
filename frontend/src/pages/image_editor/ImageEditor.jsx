// ImageEditor.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import FilerobotImageEditor, { TABS } from "react-filerobot-image-editor";
import { AiOutlineArrowLeft } from "react-icons/ai";
import Button from "../../components/Button";

/*
  One constant for the editor header height so we can
  keep the calculation in one place.
*/
const HEADER_H = 56; // 14 * 4 => 56 px
const FOOTER_H = 72;

export default function ImageEditor({
	source,
	originalUrl,
	onSave,
	onCancel,
	modalTitle = "Edit Image",
}) {
	const [sourceUrl, setSourceUrl] = useState(null);
	const editorRef = useRef(null);

	/* ------------------------------------------------------------------ */
	/*  Helpers                                                           */
	/* ------------------------------------------------------------------ */
	const revoke = useCallback((url) => url && URL.revokeObjectURL(url), []);

	/* ------------------------------------------------------------------ */
	/*  Mount / un-mount logic                                            */
	/* ------------------------------------------------------------------ */
	useEffect(() => {
	if (!source) return;
	if (source instanceof File) {
		// ✅ Handle uploaded File case
		const url = URL.createObjectURL(source);
		setSourceUrl(url);
		return () => revoke(url);
	}

	if (
    (source.status === "saved" || source.status === "generated") &&
    source.originalUrl
  ) {
    // ✅ Use originalUrl if image is saved
    setSourceUrl(source.originalUrl);
  } else {
    // ✅ Fallback to source.url
    setSourceUrl(source.url);
  }
	}, [source, revoke]);

	/* ------------------------------------------------------------------ */
	/*  Editor save handler                                               */
	/* ------------------------------------------------------------------ */
	const handleSave = async (edited, _designState) => {
		const { imageBase64, fullName } = edited;
		try {
			const res = await fetch(imageBase64);
			const blob = await res.blob();
			const fileName =
				source instanceof File
					? source.name
					: fullName || "edited-image.jpg";
			const file = new File([blob], fileName, { type: blob.type });
			onSave({ file, url: URL.createObjectURL(file) });
		} catch (err) {
			console.error("Error processing edited image:", err);
		}
	};

	// Function to trigger save programmatically
	const handleCustomSave = () => {
		if (editorRef.current) {
			// Try to access the editor's save method if available
			editorRef.current.save?.();
		} else {
			// Fallback: try multiple possible selectors
			const saveSelectors = [
				".FIE_saveBtn",
				"[data-testid='save-button']",
				".FIE_topbar button[title*='Save']",
				".FIE_topbar button:last-child",
				"button[aria-label*='save']",
				"button[aria-label*='Save']"
			];

			for (const selector of saveSelectors) {
				const saveBtn = document.querySelector(selector);
				if (saveBtn) {
					saveBtn.click();
					break;
				}
			}
		}
	};

	if (!sourceUrl) {
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-zinc-400">
				Loading editor…
			</div>
		);
	}

	/* ------------------------------------------------------------------ */
	/*  Render                                                            */
	/* ------------------------------------------------------------------ */
	return (
		<div className="fixed inset-0 z-50 flex flex-col bg-black text-white overflow-hidden">
			{/* header */}
			<header
				className="flex items-center border-b border-zinc-900 bg-zinc-950 px-4"
				style={{ height: HEADER_H }}
			>
				{/* <Button
          variant="secondary"
          onClick={onCancel}
          fullWidth={false}
          icon={<AiOutlineArrowLeft size={18} />}
        >
          Back
        </Button> */}
				<h2 className="ml-4 text-xl font-semibold">{modalTitle}</h2>
			</header>

			{/* Main Editor */}
			<main
				className="flex-grow overflow-hidden image_editor_main"
				style={{ height: `calc(100vh - ${HEADER_H + FOOTER_H}px)` }}
			>
				<FilerobotImageEditor
					ref={editorRef}
					source={sourceUrl}
					onSave={handleSave}
					onClose={onCancel}
					style={{ height: "100%" }}
					theme={{
						palette: {
							/* ----------   backgrounds   ---------- */
							"bg-primary": "#000000", // canvas / main panels
							"bg-secondary": "#0f0f0f", // side-bars, dropdowns
							"bg-primary-active": "#1a1a1a", // hovered rows, pressed buttons

							/* ----------   accents   ------------- */
							"accent-primary": "#ec4899", // Tailwind pink-500
							"accent-primary-active": "#f472b6", // pink-400 (active/pressed)

							/* ----------   icons & text  ---------- */
							"icons-primary": "#ffffff",
							"icons-secondary": "#a1a1aa",

							/* ----------   borders / dividers  ---- */
							"borders-primary": "#27272a",
							"borders-secondary": "#3f3f46",
							"borders-strong": "#52525b",

							/* ----------   misc UI  --------------- */
							"light-shadow": "rgba(255,255,255,0.07)",
							warning: "#facc15", // amber-400
						},
						typography: { fontFamily: "Inter, sans-serif" },
					}}
					tabsIds={[
						TABS.ADJUST,
						TABS.EFFECTS,
						TABS.FILTERS,
						TABS.ANNOTATE,
						TABS.RESIZE,
						TABS.FINETUNE,
					]}
					defaultTabId={TABS.ADJUST}
					Crop={{
						presetsItems: [
							{
								titleKey: "square",
								descriptionKey: "1:1",
								ratio: 1,
							},
							{
								titleKey: "landscape",
								descriptionKey: "4:3",
								ratio: 4 / 3,
							},
							{
								titleKey: "portrait",
								descriptionKey: "3:4",
								ratio: 3 / 4,
							},
							{
								titleKey: "widescreen",
								descriptionKey: "16:9",
								ratio: 16 / 9,
							},
						],
					}}
				/>
			</main>

			{/* Footer */}
			<footer 
				className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-800 bg-zinc-900" style={{ height: FOOTER_H }}
			>
				<Button variant="secondary" onClick={onCancel}>
					Cancel
				</Button>
				<Button onClick={handleCustomSave}>
					Save
				</Button>
			</footer>

			{/* Force dark theme on Filerobot internals and hide default save button */}
			<style jsx global>{`
				.FIE_root *,
				.FIE_root {
				background-color: transparent !important;
				}
				.FIE_root .FIE_topbar,
				.FIE_root .FIE_panelHeader,
				.FIE_root .FIE_rightPanel,
				.FIE_root .FIE_bottomTools,
				.FIE_root .FIE_leftPanel,
				.FIE_root .FIE_tabPanel {
				background-color: #000 !important;
				color: #fff !important;
				}
				.FIE_root input,
				.FIE_root textarea,
				.FIE_root select,
				.FIE_root button {
				color: #fff !important;
				}
				
				/* Hide the default save and cancel buttons */
				.FIE_saveBtn,
				.FIE_cancelBtn,

				/* Alternative: Hide the entire top bar if you want */
				/* .FIE_root .FIE_topbar {
				display: none !important;
				} */
				
				/* Or hide just the right side of the topbar where save/cancel usually are */
				.FIE_topbar > div:first-child {
				display: none !important;
				}
      		`}</style>
		</div>
	);
}
