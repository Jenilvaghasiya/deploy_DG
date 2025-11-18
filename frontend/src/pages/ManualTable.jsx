import React, { useState } from 'react'
import TemplateListDialog from './image_generator/TemplateList';
import { Button } from '@/components/ui/button';
import CreateSizeChartDialog from './image_generator/CreateSizeChartDialog';

const ManualTable = () => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  return (
    <>


      <CreateSizeChartDialog
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        initialData={selectedTemplate || {}}
      />
       <TemplateListDialog
            onClose={() => setShowTemplateModal(false)}
            onSelectTemplate={(tpl) => {
              setSelectedTemplate(tpl);
              // setShowTemplateModal(false);
              setShowCreateModal(true);
            }}
            onCreateManual={() => {
              setShowTemplateModal(false);
              setSelectedTemplate(null);
              setShowCreateModal(true);
            }}
          />
    </>
  )
}

export default ManualTable