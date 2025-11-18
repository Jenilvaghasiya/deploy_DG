import React from "react";

const LensFlareEffect = () => {
  return (
    <div className="lensflare-body size-full absolute top-2/4 left-2/4 transform -translate-x-2/4 -translate-y-2/4">
      <div className="container">
        <div className="accurate-burst">
          {/* Layered visual effects */}
          <div className="colored-glow" />
          <div className="multicolor-rays" />
          <div className="sparkle-overlay" />

          {/* Optional extra effects (placeholders) */}
          <div className="center-explosion" />
          <div className="sparkles-layer" />
        </div>
      </div>
    </div>
  );
};

export default LensFlareEffect;
