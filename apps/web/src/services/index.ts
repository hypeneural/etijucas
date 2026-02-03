// ======================================================
// Services Index - Re-export all services
// ======================================================

// Core Services
export { authService, tokenService } from './auth.service';
export { userService } from './user.service';

// Domain Services
export { bairroService } from './bairro.service';
export { topicService } from './topic.service';
export { eventService } from './event.service';
export { reportService } from './report.service';
export { tourismService } from './tourism.service';
export { phoneService } from './phone.service';
export { alertService } from './alert.service';
export { trashService } from './trash.service';
export { viacepService } from './viacep.service';

// Default exports for backward compatibility
export { default as authServiceDefault } from './auth.service';
export { default as userServiceDefault } from './user.service';
export { default as bairroServiceDefault } from './bairro.service';
export { default as topicServiceDefault } from './topic.service';
export { default as eventServiceDefault } from './event.service';
export { default as reportServiceDefault } from './report.service';
export { default as tourismServiceDefault } from './tourism.service';
export { default as phoneServiceDefault } from './phone.service';
export { default as alertServiceDefault } from './alert.service';
export { default as trashServiceDefault } from './trash.service';
