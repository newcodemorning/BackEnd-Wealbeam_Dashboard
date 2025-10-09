## Release [5.10.8]    **→ (Current)**
`update time : 2025-10-09`

### Changed
- **Profile**
  - return first_email field to the student profile response 
  - Updated Mongoose population to include the `user` field for retrieving the email
- **Ecosystem Configuration**
  - Enhanced `ecosystem.config.js` to include shared directories for `uploads` and `logs` to ensure persistent storage across deployments
- **Question Service**
  - Added validation to ensure that the `subject` field does not contain spaces
- **SubTeacher**
  - Added endpoints for SubTeachers to retrieve class lists and student information

### Description
> **SubTeacher Functionality:**  
> enhable to add more teachers to a class and allow them to access student information
> for each class inially created by the main teacher
> we can add multiple teachers to a class and they can access the students in that class or remove them


---

## Release [5.10.7] 
`update time : 2025-10-07`
### Changed
- **Enhanced Deployment**
  - Added environment configuration for production deployment

### Description
> **Application Name:** `Production-Backend`  
> **Deployment:** Managed with `pm2` for smooth production operation  
> **Port:** `4000`
>
> This update changes the application name to "Production-Backend" and adds environment configuration for production deployment.  
> The application is managed using pm2 to ensure reliability in a production environment and runs on port 4000.



