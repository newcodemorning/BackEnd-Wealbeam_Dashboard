#### daily form
> - the daily form is a normal form that students fill out every day to report their mood and activities 
> - we handle the daily form by creating a new form with fixed name **"daily"** 
> - the endpoint to get the daily form is: `GET /questions/daily` 
> - the endpoint to submit the daily form is: `POST /questions` => with body ```{ formName: "daily", ...otherFields}``` 
> just like any other form submission




### TODO:
- in front end add the lang in baseURL for all requests
e.g., `http://localhost:4000/en/students/login`  or `http://localhost:4000/ar/students/login`

- in backend handle the upload image => to be that .... ?!
- handle the return value (middleware) to include alt image in case it is null ()
- handle the case of image if it stored as url or path
- 