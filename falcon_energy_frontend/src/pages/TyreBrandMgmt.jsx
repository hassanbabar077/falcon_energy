import React from 'react';
import { Tag } from 'lucide-react';
import { CrudPage } from '../components/CrudPage';

const config = {
  title: 'Tyre Brand Master Data',
  icon: Tag,
  description: 'Master list of tyre brands categorized by Local or Imported origin.',
  tableName: 'tyre_brands',
  idField: 'id',
  idPrefix: 'TB-',
  columns: [
    { key: 'id', label: 'ID', format: 'bold' },
    { key: 'name', label: 'Brand Name', format: 'bold' },
    { key: 'category', label: 'Category', badge: true },
    { key: 'remarks', label: 'Remarks' },
  ],
  formFields: [
    { key: 'name', label: 'Brand Name', type: 'text', required: true },
    { key: 'category', label: 'Category', type: 'select', options: ['Local', 'Imported'], required: true, halfWidth: true },
    { key: 'remarks', label: 'Remarks', type: 'textarea' },
  ],
  defaultValues: {
    name: '',
    category: 'Local',
    remarks: '',
  },
};

export function TyreBrandMgmt() {
  return <CrudPage config={config} />;
}
