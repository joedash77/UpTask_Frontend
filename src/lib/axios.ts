import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL
})

api.interceptors.request.use( config => {
    const token = localStorage.getItem('AUTH_TOKEN')

    if(token) {
        config.headers.Authorization = `Bearer ${token}` // Header para autorizacion, SI O SI ASÍ SE ESCRIBE
    }
    return config
})

export default api