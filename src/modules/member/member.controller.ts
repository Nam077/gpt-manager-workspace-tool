import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MemberService } from './member.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Member')
@Controller('member')
export class MemberController {
    constructor(private readonly memberService: MemberService) {}

    @Post()
    create(@Body() createMemberDto: CreateMemberDto) {
        return this.memberService.create(createMemberDto);
    }

    @Get()
    findAll() {
        return this.memberService.findAll();
    }

    @Get('/workspace/:id')
    findByIdWorkSpace(@Param('id') id: string) {
        return this.memberService.findByIdWorkSpace(+id);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.memberService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateMemberDto: UpdateMemberDto) {
        return this.memberService.update(+id, updateMemberDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.memberService.remove(+id);
    }
}
