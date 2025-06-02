import { useState, useMemo } from 'react';
import { 
  Search, ChevronDown, Eye, MessageSquare, ThumbsUp, Calendar, FileText, 
  Radio, AlertCircle, Save, Send
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { newsAndEvents } from '@/data/newsAndEvents';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NewsItem {
  id: string;
  title: string;
  date: string;
  description: string;
  image: string;
  category: string;
  requirements?: {
    education: string;
    skills: string[];
  };
  responsibilities?: string[];
  engagement?: {
    views: number;
    likes: number;
    comments: number;
  };
}

// Service request form types and constants
const serviceTypes = [
  { id: 'stream', label: 'Stream Content on My Behalf' },
  { id: 'direct', label: 'Direct or Produce a Stream' },
  { id: 'sponsorship', label: 'Monetary Support or Sponsorship' },
  { id: 'creative', label: 'Creative Services (e.g., Graphics, Branding, Thumbnails)' },
  { id: 'technical', label: 'Technical Support (e.g., Setup, Optimization)' },
  { id: 'promotion', label: 'Promotion or Feature on VisionHub' },
  { id: 'consultation', label: 'Consultation/Advice Session' },
  { id: 'other', label: 'Other (please describe below)' }
] as const;

const communicationMethods = [
  { value: 'in-app', label: 'In-App Messaging' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone/Call' },
  { value: 'other', label: 'Other (specify in notes)' }
] as const;

const budgetTypes = [
  { value: 'fixed', label: 'Fixed' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'revenue-share', label: 'Revenue share' }
] as const;

type ServiceType = typeof serviceTypes[number]['id'];
type CommunicationMethod = typeof communicationMethods[number]['value'];
type BudgetType = typeof budgetTypes[number]['value'];

interface FormData {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  serviceTypes: ServiceType[];
  description: string;
  expectedOutcome: string;
  deadline: string;
  additionalNotes: string;
  communicationMethod: CommunicationMethod;
  budget: {
    type: BudgetType;
    amount: string;
  };
}

const LibraryScreen = () => {
  const [activeTab, setActiveTab] = useState('articles');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Form state with proper typing
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    serviceTypes: [],
    description: '',
    expectedOutcome: '',
    deadline: '',
    additionalNotes: '',
    communicationMethod: 'in-app',
    budget: {
      type: 'fixed',
      amount: ''
    }
  });

  const handleSubmitService = () => {
    // Here you would implement the service request submission
    console.log('Service request data:', formData);
    // TODO: Add actual submission logic
  };

  const handleSaveAsDraft = () => {
    // Here you would implement draft saving functionality
    console.log('Saving draft:', formData);
    // TODO: Add draft saving logic
  };  const parseEventDate = (dateStr: string) => {
    // Handle date format like "2025-06-15" or date ranges like "2025-06-15 - 2025-06-20"
    const firstDate = dateStr.split('-')[0].trim(); // Get the first date in case of a range
    return new Date(firstDate);
  };

  const filteredArticles = useMemo(() => {
    const query = searchQuery.toLowerCase();
    let filtered = newsAndEvents.filter(item => 
      item.category !== 'Webinars' && (
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      )
    );

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    return filtered.sort((a, b) => {
      const dateA = parseEventDate(a.date);
      const dateB = parseEventDate(b.date);
      return sortOrder === 'newest' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
    });
  }, [searchQuery, selectedCategory, sortOrder]);

  const webinars = useMemo(() => {
    return newsAndEvents
      .filter(item => item.category === 'Webinars')
      .sort((a, b) => {
        const dateA = parseEventDate(a.date);
        const dateB = parseEventDate(b.date);
        return dateB.getTime() - dateA.getTime(); // Always show newest webinars first
      });
  }, []);

  const categories = useMemo(() => {
    return Array.from(new Set(newsAndEvents.map(item => item.category)));
  }, []);

  const getEventStatus = (date: string): 'Upcoming' | 'Ended' => {
    const eventDate = new Date(date.split('-')[0]);
    const today = new Date();
    return eventDate > today ? 'Upcoming' : 'Ended';
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const renderEventCard = (item: NewsItem) => (
    <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="relative">
        <img src={item.image} alt={item.title} className="w-full h-48 object-cover" />
        <div className="absolute top-4 right-4 flex space-x-2">
          {(['Webinars', 'Other Webinars and Conferences'].includes(item.category)) && (
            <div className={`bg-white text-sm font-medium px-3 py-1 rounded-full ${
              getEventStatus(item.date) === 'Upcoming' ? 'text-green-600' : 'text-gray-600'
            }`}>
              {getEventStatus(item.date)}
            </div>
          )}
          <div className="bg-teal-400 text-white px-3 py-1 rounded-full text-sm font-semibold">
            {item.date}
          </div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2">{item.title}</h3>
        <p className="text-gray-600 text-sm mb-4">{item.description}</p>
        
        {item.category === 'Career Opportunities' && (
          <div className="space-y-4 mb-4">
            {item.responsibilities && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Essential Responsibilities:</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {item.responsibilities.map((resp, idx) => (
                    <li key={idx}>{resp}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {item.requirements && (
              <>
                <div>
                  <h4 className="font-semibold text-sm mb-2">Education requirement:</h4>
                  <p className="text-sm text-gray-600">{item.requirements.education}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">Necessary skillset:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {item.requirements.skills.map((skill, idx) => (
                      <li key={idx}>{skill}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        )}
        
        {item.engagement && (
          <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{formatNumber(item.engagement.views)}</span>
            </div>
            <div className="flex items-center gap-1">
              <ThumbsUp className="w-4 h-4" />
              <span>{formatNumber(item.engagement.likes)}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              <span>{formatNumber(item.engagement.comments)}</span>
            </div>
          </div>
        )}

        <Button variant="outline" className="w-full rounded-xl border-red-500 text-red-500 hover:bg-red-50">
          {item.category === 'Career Opportunities' ? 'Send Resume →' :
           (['Webinars', 'Other Webinars and Conferences'].includes(item.category))
            ? getEventStatus(item.date) === 'Upcoming' ? 'Register Now →' : 'Watch Recording →'
            : 'Read More →'
          }
        </Button>
      </div>
    </div>
  );
const renderServiceRequestForm = () => (
  <div className="max-w-4xl mx-auto">
    <Card className=" border-0 bg-white">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-cyan-600 to-red-800 text-white p-8 rounded-t-lg">
        <h2 className="text-2xl font-bold mb-2">Service Request</h2>
        <p className="text-blue-100 text-sm">
          Please complete all required fields to submit your service request for review
        </p>
      </div>

      <div className="p-8 space-y-10">
        {/* Client Information */}
        <section className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
              Client Information
            </h3>
            <p className="text-gray-600 text-sm mt-1">Please provide your contact details and identification information</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                Full Legal Name <span className="text-red-600">*</span>
              </Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Enter your complete legal name"
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                Professional Handle/Username <span className="text-red-600">*</span>
              </Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="@professional_handle"
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Business Email Address <span className="text-red-600">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="professional@company.com"
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Contact Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 (555) 000-0000"
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>

        {/* Service Classification */}
        <section className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
              Service Classification <span className="text-red-600">*</span>
            </h3>
            <p className="text-gray-600 text-sm mt-1">Select all applicable service categories for your request</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {serviceTypes.map((service) => (
              <div key={service.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <Switch
                    id={service.id}
                    checked={formData.serviceTypes.includes(service.id)}
                    onCheckedChange={(checked) => {
                      setFormData(prev => ({
                        ...prev,
                        serviceTypes: checked 
                          ? [...prev.serviceTypes, service.id]
                          : prev.serviceTypes.filter(t => t !== service.id)
                      }))
                    }}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <Label htmlFor={service.id} className="text-sm font-medium text-gray-700 cursor-pointer">
                    {service.label}
                  </Label>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Project Specifications */}
        <section className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
              Project Specifications <span className="text-red-600">*</span>
            </h3>
            <p className="text-gray-600 text-sm mt-1">Provide comprehensive details about your service requirements</p>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Detailed Service Description <span className="text-red-600">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Please provide a comprehensive description of the services you require, including specific technical requirements, scope of work, and any relevant background information..."
                className="min-h-[120px] border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="expectedOutcome" className="text-sm font-medium text-gray-700">
                  Expected Deliverables & Performance Metrics <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="expectedOutcome"
                  value={formData.expectedOutcome}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedOutcome: e.target.value }))}
                  placeholder="e.g., 2-hour live stream in 1080p with 99% uptime"
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline" className="text-sm font-medium text-gray-700">
                  Project Deadline
                </Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="additionalNotes" className="text-sm font-medium text-gray-700">
                Additional Requirements & Specifications
              </Label>
              <Textarea
                id="additionalNotes"
                value={formData.additionalNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                placeholder="Include any additional requirements, file attachments, reference materials, technical specifications, or special considerations..."
                className="min-h-[80px] border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>

        {/* Communication Preferences */}
        <section className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">4</span>
              Communication Preferences
            </h3>
            <p className="text-gray-600 text-sm mt-1">Select your preferred method for project communication and updates</p>
          </div>
          <RadioGroup
            value={formData.communicationMethod}
            onValueChange={(value) => setFormData(prev => ({ ...prev, communicationMethod: value as CommunicationMethod }))}
            className="space-y-3"
          >
            {communicationMethods.map((method) => (
              <div key={method.value} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem 
                    value={method.value} 
                    id={method.value}
                    className="text-blue-600 border-gray-300"
                  />
                  <Label htmlFor={method.value} className="text-sm font-medium text-gray-700 cursor-pointer">
                    {method.label}
                  </Label>
                </div>
              </div>
            ))}
          </RadioGroup>
        </section>

        {/* Budget & Compensation */}
        <section className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">5</span>
              Budget & Compensation Structure
            </h3>
            <p className="text-gray-600 text-sm mt-1">Specify your proposed budget or compensation arrangement</p>
          </div>
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">Compensation Type</Label>
              <RadioGroup
                value={formData.budget.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, budget: { ...prev.budget, type: value as BudgetType } }))}
                className="space-y-3"
              >
                {budgetTypes.map((type) => (
                  <div key={type.value} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem 
                        value={type.value} 
                        id={`budget-${type.value}`}
                        className="text-blue-600 border-gray-300"
                      />
                      <Label htmlFor={`budget-${type.value}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                        {type.label}
                      </Label>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budgetAmount" className="text-sm font-medium text-gray-700">
                Budget Amount or Terms
              </Label>
              <Input
                id="budgetAmount"
                value={formData.budget.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: { ...prev.budget, amount: e.target.value } }))}
                placeholder={formData.budget.type === 'revenue-share' ? 'Describe revenue sharing terms and percentages' : 'Enter proposed budget amount'}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>

        {/* Submission Section */}
        <section className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-900">Request Review Process</h4>
                <p className="text-sm text-blue-800 leading-relaxed">
                  Your service request will be reviewed by our professional team within 24-48 business hours. 
                  We will contact you via your preferred communication method to discuss project details, 
                  timeline, and next steps. Please note that submission of this request does not constitute 
                  a binding agreement or guarantee of service fulfillment.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300" 
              variant="outline" 
              onClick={handleSaveAsDraft}
            >
              <Save className="w-4 h-4 mr-2" />
              Save as Draft
            </Button>
            <Button 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium" 
              onClick={handleSubmitService}
            >
              <Send className="w-4 h-4 mr-2" />
              Submit Professional Request
            </Button>
          </div>
        </section>
      </div>
    </Card>
  </div>
);  return (
    <div className="min-h-screen bg-white">
      <div className="px-6 pt-8">
        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-2 mb-8 max-w-[400px] mx-auto">
          {/* Background slider */}
          <div
            className={`absolute top-3 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-xl transition-all duration-200 ease-in-out`}
            style={{
              left: '0%',
              width: '33.33%',
              transform: `translateX(${activeTab === 'articles' ? '0%' : activeTab === 'webinars' ? '100%' : '200%'})`
            }}
          />
          
          {/* Tab Buttons */}
          <div className="relative flex z-10">
            <button
              onClick={() => setActiveTab('articles')}
              className={`flex items-center justify-center gap-2 h-11 flex-1 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'articles' ? 'text-white' : ''
              }`}
            >
              <FileText className="w-4 h-4" />
              Articles
            </button>
            <button
              onClick={() => setActiveTab('webinars')}
              className={`flex items-center justify-center gap-2 h-11 flex-1 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'webinars' ? 'text-white' : ''
              }`}
            >
              <Radio className="w-4 h-4" />
              Webinars
            </button>
            <button
              onClick={() => setActiveTab('service')}
              className={`flex items-center justify-center gap-2 h-11 flex-1 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'service' ? 'text-white' : ''
              }`}
            >
              <Send className="w-4 h-4" />
              Services
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-[90%] mx-auto pb-8">
        <Tabs value={activeTab} className="w-full flex flex-col items-center" onValueChange={(value) => setActiveTab(value as 'articles' | 'webinars' | 'service')}>
          <TabsContent value="articles">
            {/* Existing News & Events content */}
            <div className="space-y-12">
              {/* Search and filters */}
              <div className="space-y-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search news and events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 py-4 rounded-xl border-gray-200"
                  />
                </div>
                <div className="flex space-x-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="rounded-xl">
                        Sort {sortOrder === 'newest' ? '↑' : '↓'}
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setSortOrder('newest')}>
                        Newest First
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortOrder('oldest')}>
                        Oldest First
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="rounded-xl">
                        {selectedCategory}
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setSelectedCategory('All')}>
                        All
                      </DropdownMenuItem>
                      {categories.map(category => (
                        <DropdownMenuItem key={category} onClick={() => setSelectedCategory(category)}>
                          {category}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* News & Events Grid */}              {selectedCategory === 'All' ? (
                categories.map(category => {
                  const categoryItems = filteredArticles.filter(item => item.category === category);
                  if (categoryItems.length === 0 || category === 'Webinars') return null;
                  
                  return (
                    <div key={category}>
                      <h2 className="text-2xl font-bold mb-6">{category}</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {categoryItems.map(renderEventCard)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div>
                  <h2 className="text-2xl font-bold mb-6">{selectedCategory}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredArticles.map(renderEventCard)}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>          <TabsContent value="webinars">
            <div className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {webinars.map(renderEventCard)}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="service">
            {renderServiceRequestForm()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LibraryScreen;
