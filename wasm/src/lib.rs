use wasm_bindgen::prelude::*;

/// Result of frame quality analysis.
#[wasm_bindgen]
pub struct FrameAnalysis {
    /// Weighted luminance, 0.0 (black) – 1.0 (white).
    pub brightness: f32,
    /// Laplacian variance: higher = sharper.
    pub sharpness: f32,
}

/// Analyse an RGBA frame from a canvas ImageData.
///
/// # Arguments
/// * `pixels` – raw RGBA bytes (length = width * height * 4)
/// * `width`  – frame width in pixels
/// * `height` – frame height in pixels
#[wasm_bindgen]
pub fn analyze_frame(pixels: &[u8], width: u32, height: u32) -> FrameAnalysis {
    let w = width as usize;
    let h = height as usize;
    let n = w * h;

    if n == 0 || pixels.len() < n * 4 {
        return FrameAnalysis { brightness: 0.0, sharpness: 0.0 };
    }

    // --- Brightness: weighted luminance average ---------------------------------
    let mut luma_sum: f64 = 0.0;
    // Greyscale buffer for Laplacian
    let mut grey = vec![0f32; n];

    for i in 0..n {
        let base = i * 4;
        let r = pixels[base] as f64;
        let g = pixels[base + 1] as f64;
        let b = pixels[base + 2] as f64;
        let l = 0.299 * r + 0.587 * g + 0.114 * b;
        luma_sum += l;
        grey[i] = l as f32;
    }

    let brightness = (luma_sum / (n as f64 * 255.0)) as f32;

    // --- Sharpness: variance of discrete Laplacian (3×3 kernel) ----------------
    // kernel: [0,1,0, 1,-4,1, 0,1,0]
    // We skip the border pixels for simplicity.
    if w < 3 || h < 3 {
        return FrameAnalysis { brightness, sharpness: 0.0 };
    }

    let mut lap_sum: f64 = 0.0;
    let mut lap_sq_sum: f64 = 0.0;
    let count = ((w - 2) * (h - 2)) as f64;

    for y in 1..(h - 1) {
        for x in 1..(w - 1) {
            let idx = y * w + x;
            let lap = (grey[idx - w]        // top
                + grey[idx + w]             // bottom
                + grey[idx - 1]             // left
                + grey[idx + 1]             // right
                - 4.0 * grey[idx]) as f64;  // center
            lap_sum += lap;
            lap_sq_sum += lap * lap;
        }
    }

    let mean = lap_sum / count;
    let variance = (lap_sq_sum / count) - (mean * mean);
    let sharpness = variance.max(0.0) as f32;

    FrameAnalysis { brightness, sharpness }
}
