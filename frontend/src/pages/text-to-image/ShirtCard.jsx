import React from 'react'

const ShirtCard = ({id, setContextMenu, image }) => {
    const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent click from bubbling up and closing the menu immediately
        setContextMenu({
          visible: true,
          x: e.clientX,
          y: e.clientY,
          shirtId: id, // Reference to the specific shirt card
        });
    };

    return (
      <div
        className="bg-gray-800 h-64 rounded-lg flex items-center justify-center transition-transform duration-300 hover:scale-150"
        onClick={handleClick}
      >
         {image ? (
           <img
           src={image}
           alt={`Shirt ${id}`}
           style={{ width: '200px' }} // Adjust styling as needed
         />
          ) : (
            <span className="text-gray-500">[Shirt Image Placeholder {id}]</span>
          )}
      </div>
    );
  };


export default ShirtCard