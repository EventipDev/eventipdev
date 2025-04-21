# News Management System

This document provides information about the News Management system, including how to set it up, use it, and troubleshoot common issues.

## Features

- Create, edit, and delete news posts
- Rich text editor for post content
- Image uploads stored directly as base64 in the database
- Category classification
- Featured posts
- Publication status management (draft, published)
- Responsive design for all devices

## Setup

1. **Database Setup**
   
   Run the SQL scripts in the following order:
   
   ```bash
   # First set up the trigger function
   psql -d your_database_name -f src/database/migrations/trigger_set_timestamp.sql
   
   # Then create the news_posts table
   psql -d your_database_name -f src/database/migrations/news_posts_table.sql
   ```

2. **Install Dependencies**
   
   The news system requires React-Quill for the rich text editor. Install it by running:
   
   ```bash
   npm run install-news-deps
   # or manually:
   npm install --save react-quill
   ```

3. **Restart Development Server**
   
   After installing dependencies, restart your development server:
   
   ```bash
   npm run dev
   ```

## Troubleshooting

### Hydration Errors

If you encounter hydration errors like `Error: Hydration failed because the server rendered HTML didn't match the client.` or `react_dom_1.default.findDOMNode is not a function`, it could be due to:

1. **ReactQuill Rendering Issues**

   ReactQuill needs to be loaded client-side only and wrapped properly. The best approach for React 18+ compatibility is using a wrapper:
   
   ```javascript
   // Create a wrapper component to fix findDOMNode deprecation issues
   const ReactQuillWrapper = forwardRef(({ value, onChange, modules, formats }, ref) => {
     // Only import ReactQuill on client side
     const [QuillComponent, setQuillComponent] = useState(null);
   
     useEffect(() => {
       // Dynamically import ReactQuill only on client side
       import('react-quill').then((module) => {
         setQuillComponent(() => module.default);
       });
     }, []);
   
     if (!QuillComponent) {
       return <div>Loading editor...</div>;
     }
   
     return (
       <QuillComponent
         ref={ref}
         theme="snow"
         value={value}
         onChange={onChange}
         modules={modules}
         formats={formats}
       />
     );
   });
   
   // Remember to add a display name
   ReactQuillWrapper.displayName = 'ReactQuillWrapper';
   ```

2. **Avoiding Old Dynamic Import Pattern**

   The old dynamic import pattern can cause issues with React 18+:
   
   ```javascript
   // DON'T use this pattern with newer React versions
   const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
   ```

3. **CSS Issues**

   Make sure `react-quill/dist/quill.snow.css` is imported in your component.

### Image Storage

Images are stored directly in the database as base64 strings rather than in a storage bucket. This approach:

- Simplifies deployment (no need for separate storage setup)
- Works well for smaller images and moderate traffic sites
- May increase database size for sites with many images

To convert back to bucket storage, you would need to modify the image handling in the create and edit pages.

## Files Overview

- `src/app/admin/news/page.js` - News posts listing and management page
- `src/app/admin/news/create/page.js` - Create new news post page
- `src/app/admin/news/edit/[id]/page.js` - Edit existing news post page
- `src/app/news/page.js` - Public news listing page
- `src/app/news/[slug]/page.js` - Public news post detail page
- `src/database/migrations/news_posts_table.sql` - SQL for creating the news_posts table
- `src/database/migrations/trigger_set_timestamp.sql` - SQL for the automatic timestamp update trigger 