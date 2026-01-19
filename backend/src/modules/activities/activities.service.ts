import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from './entities/activity.entity';

@Injectable()
export class ActivitiesService {
    constructor(
        @InjectRepository(Activity)
        private activitiesRepository: Repository<Activity>,
    ) { }

    async create(createActivityDto: any) {
        const activity = this.activitiesRepository.create(createActivityDto);
        return this.activitiesRepository.save(activity);
    }

    async findAll() {
        return this.activitiesRepository.find();
    }

    async findOne(id: string) {
        return this.activitiesRepository.findOne({ where: { id } });
    }

    async update(id: string, updateActivityDto: any) {
        await this.activitiesRepository.update(id, {
            ...updateActivityDto,
            lastUpdatedAt: new Date(),
        });
        return this.findOne(id);
    }

    async remove(id: string) {
        return this.activitiesRepository.delete(id);
    }
}
