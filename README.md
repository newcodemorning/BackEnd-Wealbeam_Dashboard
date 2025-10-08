



## Release [5.10.8]    **→ (Current)**
`update time : 2025-10-08`

### Changed
- **Profile Service**
  - Added `first_email` field to the student profile response to include the student's email address
  - Updated Mongoose population to include the `user` field for retrieving the email
  
### Description
> **Service Name:** `Profile Service`  
> **Functionality:** Manages student profiles and related data  
> **Database:** MongoDB with Mongoose ORM















---

## Release [5.10.7] - 2025-10-07
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

---

## Release [5.7.9] - 2025-10-01
### Fixed
- **CORS Configuration**
  - Resolved cross-origin resource sharing issues caused by Vite's optimized dependencies cache corruption



