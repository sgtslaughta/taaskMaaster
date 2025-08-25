/**
 * @fileoverview Design System Demo Component
 * @description A comprehensive demo showcasing all design system components and their variants
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { 
  Button, 
  ButtonGroup, 
  Input, 
  InputGroup, 
  Card, 
  CardHeader, 
  CardBody, 
  CardFooter,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter
} from '../index';
import { 
  PlusIcon, 
  CheckIcon, 
  ExclamationTriangleIcon,
  UserIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

/**
 * @description Design System Demo Component
 * @returns Demo component showcasing all design system features
 */
export const DesignSystemDemo: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [inputValue, setInputValue] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            TaaskMaaster Design System
          </h1>
          <p className="text-lg text-gray-600">
            A comprehensive, family-friendly design system for modern web applications
          </p>
        </div>

        {/* Button Examples */}
        <Card>
          <CardHeader title="Button Components" subtitle="Various button variants and sizes" />
          <CardBody className="space-y-6">
            
            {/* Button Variants */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Button Variants</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="accent">Accent</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="success">Success</Button>
                <Button variant="warning">Warning</Button>
              </div>
            </div>

            {/* Button Sizes */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Button Sizes</h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="xs">Extra Small</Button>
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button size="xl">Extra Large</Button>
              </div>
            </div>

            {/* Button with Icons */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Buttons with Icons</h3>
              <div className="flex flex-wrap gap-3">
                <Button leftIcon={<PlusIcon className="h-4 w-4" />}>
                  Add Item
                </Button>
                <Button 
                  variant="success" 
                  rightIcon={<CheckIcon className="h-4 w-4" />}
                >
                  Complete
                </Button>
                <Button 
                  variant="outline" 
                  leftIcon={<ExclamationTriangleIcon className="h-4 w-4" />}
                >
                  Warning
                </Button>
              </div>
            </div>

            {/* Loading States */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Loading States</h3>
              <div className="flex flex-wrap gap-3">
                <Button loading>Loading...</Button>
                <Button variant="secondary" loading>Processing</Button>
                <Button variant="accent" loading>Submitting</Button>
              </div>
            </div>

            {/* Button Groups */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Button Groups</h3>
              <div className="flex flex-wrap gap-4">
                <ButtonGroup attached>
                  <Button variant="outline">Left</Button>
                  <Button variant="outline">Center</Button>
                  <Button variant="outline">Right</Button>
                </ButtonGroup>
                
                <ButtonGroup attached vertical>
                  <Button variant="outline">Top</Button>
                  <Button variant="outline">Middle</Button>
                  <Button variant="outline">Bottom</Button>
                </ButtonGroup>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Input Examples */}
        <Card>
          <CardHeader title="Input Components" subtitle="Form inputs with various states and features" />
          <CardBody className="space-y-6">
            
            {/* Basic Inputs */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Basic Inputs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Email Address" 
                  placeholder="Enter your email"
                  type="email"
                />
                <Input 
                  label="Full Name" 
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            {/* Input with Icons */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Inputs with Icons</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Username"
                  placeholder="Enter username"
                  leftIcon={<UserIcon className="h-5 w-5" />}
                />
                <Input 
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  leftIcon={<LockClosedIcon className="h-5 w-5" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  }
                />
              </div>
            </div>

            {/* Input States */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Input States</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input 
                  label="Success Input"
                  value="Valid input"
                  state="success"
                  helperText="This input is valid"
                />
                <Input 
                  label="Error Input"
                  value="Invalid input"
                  state="error"
                  error="This field is required"
                />
                <Input 
                  label="Warning Input"
                  value="Warning input"
                  state="warning"
                  warning="Please review this input"
                />
              </div>
            </div>

            {/* Input with Character Count */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Input with Character Count</h3>
              <Input 
                label="Description"
                placeholder="Enter description"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                showCharacterCount
                maxLength={100}
                helperText="Maximum 100 characters allowed"
              />
            </div>

            {/* Input Groups */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Input Groups</h3>
              <InputGroup label="Price Range">
                <Input placeholder="Min price" type="number" />
                <Input placeholder="Max price" type="number" />
              </InputGroup>
            </div>
          </CardBody>
        </Card>

        {/* Card Examples */}
        <Card>
          <CardHeader title="Card Components" subtitle="Content containers with various layouts" />
          <CardBody className="space-y-6">
            
            {/* Card Variants */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Card Variants</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card variant="default" size="sm">
                  <CardBody>
                    <p className="text-sm text-gray-600">Default Card</p>
                  </CardBody>
                </Card>
                
                <Card variant="elevated" size="sm">
                  <CardBody>
                    <p className="text-sm text-gray-600">Elevated Card</p>
                  </CardBody>
                </Card>
                
                <Card variant="outlined" size="sm">
                  <CardBody>
                    <p className="text-sm text-gray-600">Outlined Card</p>
                  </CardBody>
                </Card>
                
                <Card variant="ghost" size="sm">
                  <CardBody>
                    <p className="text-sm text-gray-600">Ghost Card</p>
                  </CardBody>
                </Card>
                
                <Card variant="glass" size="sm">
                  <CardBody>
                    <p className="text-sm text-gray-600">Glass Card</p>
                  </CardBody>
                </Card>
                
                <Card variant="interactive" size="sm" clickable>
                  <CardBody>
                    <p className="text-sm text-gray-600">Interactive Card</p>
                  </CardBody>
                </Card>
              </div>
            </div>

            {/* Complex Card */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Complex Card Layout</h3>
              <Card variant="elevated" size="lg">
                <CardHeader 
                  title="Task Management" 
                  subtitle="Organize your daily tasks efficiently"
                  actions={
                    <Button size="sm" variant="outline">
                      <PlusIcon className="h-4 w-4" />
                      Add Task
                    </Button>
                  }
                />
                <CardBody>
                  <p className="text-gray-600 mb-4">
                    This is an example of a complex card with header, body, and footer sections.
                    It demonstrates how to structure content in an organized and visually appealing way.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Task List</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center gap-2">
                        <CheckIcon className="h-4 w-4 text-green-500" />
                        Complete design system documentation
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckIcon className="h-4 w-4 text-green-500" />
                        Review component accessibility
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                        Implement dark mode support
                      </li>
                    </ul>
                  </div>
                </CardBody>
                <CardFooter 
                  actions={
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Cancel</Button>
                      <Button size="sm">Save Changes</Button>
                    </div>
                  }
                >
                  <p className="text-xs text-gray-500">
                    Last updated: {new Date().toLocaleDateString()}
                  </p>
                </CardFooter>
              </Card>
            </div>
          </CardBody>
        </Card>

        {/* Modal Example */}
        <Card>
          <CardHeader title="Modal Component" subtitle="Overlay dialogs with backdrop support" />
          <CardBody>
            <div className="space-y-4">
              <p className="text-gray-600">
                Click the button below to open a modal dialog that demonstrates the modal component features.
              </p>
              <Button onClick={() => setIsModalOpen(true)}>
                Open Modal
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Modal */}
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          title="Example Modal"
          subtitle="This is an example modal with various features"
        >
          <ModalBody>
            <div className="space-y-4">
              <p className="text-gray-600">
                This modal demonstrates the modal component with proper accessibility features,
                backdrop handling, and keyboard navigation support.
              </p>
              
              <Input 
                label="Modal Input"
                placeholder="Enter some text"
                helperText="This input is inside the modal"
              />
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Features</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Backdrop click to close</li>
                  <li>• Escape key to close</li>
                  <li>• Focus management</li>
                  <li>• Body scroll prevention</li>
                  <li>• Accessibility support</li>
                </ul>
              </div>
            </div>
          </ModalBody>
          <ModalFooter 
            actions={
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsModalOpen(false)}>
                  Confirm
                </Button>
              </div>
            }
          />
        </Modal>
      </div>
    </div>
  );
};
