export default function LoadingAnimation({ stage }: { stage: string }) {
    const getAnimation = () => {
        if (stage.includes("Analisando") || stage.includes("vídeo")) {
            return "analyzing";
        }
        if (stage.includes("Treinando") || stage.includes("Otimizando")) {
            return "training";
        }
        if (stage.includes("Concluído") || stage.includes("OK")) {
            return "success";
        }
        return "processing";
    };

    const animationType = getAnimation();

    return (
        <div className="loading-container">
            <div className={`animation-wrapper ${animationType}`}>
                {animationType === "analyzing" && (
                    <div className="analyzing-animation">
                        <div className="brain-icon">🧠</div>
                        <div className="scan-lines">
                            <div className="scan-line"></div>
                            <div className="scan-line"></div>
                            <div className="scan-line"></div>
                        </div>
                        <div className="particles">
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className="particle" style={{
                                    '--delay': `${i * 0.1}s`,
                                    '--angle': `${i * 30}deg`
                                } as any}></div>
                            ))}
                        </div>
                    </div>
                )}

                {animationType === "training" && (
                    <div className="training-animation">
                        <div className="neural-network">
                            <div className="layer">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="neuron"></div>
                                ))}
                            </div>
                            <div className="layer">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="neuron"></div>
                                ))}
                            </div>
                            <div className="layer">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="neuron"></div>
                                ))}
                            </div>
                        </div>
                        <div className="training-pulse"></div>
                    </div>
                )}

                {animationType === "success" && (
                    <div className="success-animation">
                        <div className="checkmark-circle">
                            <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                                <circle className="checkmark-circle-bg" cx="26" cy="26" r="25" fill="none" />
                                <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                            </svg>
                        </div>
                        <div className="success-sparks">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="spark" style={{
                                    '--spark-angle': `${i * 45}deg`
                                } as any}></div>
                            ))}
                        </div>
                    </div>
                )}

                {animationType === "processing" && (
                    <div className="processing-animation">
                        <div className="spinner-ring"></div>
                        <div className="spinner-ring"></div>
                        <div className="spinner-ring"></div>
                    </div>
                )}
            </div>

            <div className="loading-text">
                {stage}
            </div>

            <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    );
}
