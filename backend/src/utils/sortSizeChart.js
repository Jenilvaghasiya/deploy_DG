const sizeOrder = ['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl', '2xl', '3xl', '4xl', '5xl'];
    
export const sortMeasurements = (measurements) => {
    const sortedMeasurements = {};        
    Object.keys(measurements).forEach(measurementKey => {
        const measurementData = measurements[measurementKey];
        const sortedSizes = {};                        
        sizeOrder.forEach(size => {                
            const actualKey = Object.keys(measurementData).find(key => 
                key.toLowerCase() === size.toLowerCase()
            );
            
            if (actualKey) {
                sortedSizes[actualKey] = measurementData[actualKey];
            }
        });
                    
        Object.keys(measurementData).forEach(size => {
            const sizeExists = sizeOrder.some(orderedSize => 
                orderedSize.toLowerCase() === size.toLowerCase()
            );
            
            if (!sizeExists && !sortedSizes.hasOwnProperty(size)) {
                sortedSizes[size] = measurementData[size];
            }
        });
        
        sortedMeasurements[measurementKey] = sortedSizes;
    });
    
    return sortedMeasurements;
};